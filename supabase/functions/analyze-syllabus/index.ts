import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentText } = await req.json();
    
    if (!documentText || documentText.trim().length < 50) {
      return new Response(
        JSON.stringify({ error: "Document text is too short or empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use tool calling for structured output
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert at analyzing academic syllabus documents. Extract structured course information with high accuracy. Pay special attention to:
- Course schedule with ALL dates, topics, and activities
- Grading breakdown with exact percentages
- Important dates for exams, projects, and assignments
- Instructor contact information and office hours
- Course policies

Be thorough and extract every relevant detail.`
          },
          {
            role: "user",
            content: `Analyze this syllabus and extract all course information:\n\n${documentText.slice(0, 50000)}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_syllabus_data",
            description: "Extract structured course data from a syllabus document",
            parameters: {
              type: "object",
              properties: {
                course: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "Full course title" },
                    code: { type: "string", description: "Course code (e.g., CS101)" },
                    semester: { type: "string", description: "Semester and year (e.g., Fall 2024)" },
                    institution: { type: "string", description: "University or college name" }
                  },
                  required: ["title", "code", "semester"]
                },
                instructors: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      email: { type: "string" },
                      office_hours: { type: "string" },
                      location: { type: "string" },
                      role: { type: "string", enum: ["professor", "ta"] }
                    },
                    required: ["name", "email"]
                  }
                },
                grading: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      component: { type: "string", description: "Name of grading component" },
                      weight: { type: "number", description: "Weight as decimal (0.3 for 30%)" },
                      description: { type: "string" }
                    },
                    required: ["component", "weight"]
                  }
                },
                schedule: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      date: { type: "string", description: "Date in YYYY-MM-DD format or week description" },
                      week: { type: "number" },
                      topic: { type: "string" },
                      activities: {
                        type: "array",
                        items: { type: "string", enum: ["lecture", "lab", "quiz", "exam", "assignment", "monitored"] }
                      },
                      deliverables: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            due: { type: "string" },
                            type: { type: "string", enum: ["assignment", "quiz", "exam", "project"] }
                          }
                        }
                      },
                      readings: { type: "array", items: { type: "string" } }
                    },
                    required: ["week", "topic"]
                  }
                },
                important_dates: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      date: { type: "string", description: "YYYY-MM-DD format" },
                      type: { type: "string", enum: ["exam", "deadline", "break", "other"] }
                    },
                    required: ["name", "date", "type"]
                  }
                },
                policies: {
                  type: "object",
                  properties: {
                    late_work: { type: "string" },
                    attendance: { type: "string" },
                    honor_code: { type: "string" }
                  }
                }
              },
              required: ["course", "instructors", "grading", "schedule", "policies"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_syllabus_data" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("No structured data returned from AI");
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    
    return new Response(
      JSON.stringify({
        extractedData,
        confidence: 0.95,
        extractionLog: ["Successfully analyzed with Lovable AI (Gemini 2.5 Flash)"]
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Analysis error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        extractedData: null,
        confidence: 0
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
