import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { tools, executeTool } from "@/lib/agent-tools";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Apex, an expert AI mortgage advisor built by Apex Mortgage Group.
You help homebuyers and homeowners navigate every aspect of mortgage financing with accuracy, clarity, and warmth.

Your expertise includes:
- Purchase mortgages and refinancing
- Loan types: conventional, FHA, VA, jumbo, USDA
- Debt-to-income (DTI) analysis and affordability
- Amortization and payment structures
- Closing costs and cash-to-close estimates
- Pre-qualification guidance
- Credit score impact on rates

When a user asks a financial question, use your available tools to compute exact numbers — never estimate mortgage math in your head. Present results in a clear, friendly format with key figures highlighted.

Always remind users that your calculations are illustrative and they should consult a licensed loan officer for official pre-approval.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    const anthropicMessages: Anthropic.MessageParam[] = messages.map(
      (m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })
    );

    // Agentic loop — resolve all tool calls before returning
    let currentMessages = [...anthropicMessages];

    while (true) {
      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools,
        messages: currentMessages,
      });

      if (response.stop_reason === "end_turn") {
        const textBlock = response.content.find((b) => b.type === "text");
        return NextResponse.json({
          role: "assistant",
          content: textBlock?.type === "text" ? textBlock.text : "",
        });
      }

      if (response.stop_reason === "tool_use") {
        const toolUseBlocks = response.content.filter(
          (b) => b.type === "tool_use"
        );

        // Add assistant message with tool use blocks
        currentMessages = [
          ...currentMessages,
          { role: "assistant", content: response.content },
        ];

        // Execute all tools and add results
        const toolResults: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map(
          (block) => {
            if (block.type !== "tool_use") throw new Error("Unexpected block");
            const result = executeTool(
              block.name,
              block.input as Record<string, unknown>
            );
            return {
              type: "tool_result" as const,
              tool_use_id: block.id,
              content: JSON.stringify(result),
            };
          }
        );

        currentMessages = [
          ...currentMessages,
          { role: "user", content: toolResults },
        ];

        continue;
      }

      // Unexpected stop reason
      return NextResponse.json(
        { error: "Unexpected agent state" },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("Agent error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
