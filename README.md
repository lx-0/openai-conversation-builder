# OpenAI Conversation Builder

This project is a Node.js script that simulates a conversation between two agents using OpenAI's API. It uses `gpt-4o-mini` to generate an iterative conversation, including follow-up questions and responses.

## Features

- Automatically generates a conversation between two agents.
- Logs conversation progress to a file in the `conversations` directory.
- Tracks token usage and estimates costs for both input and output tokens.
- Supports dynamic follow-up question generation based on the current conversation context.
- Differentiates between cached and non-cached input tokens for accurate cost estimation.
- Outputs system instructions and prompts for better transparency of conversation flow.

## Requirements

- Node.js
- The following npm packages:
  - `axios`
  - `dotenv`
  - `fs`
  - `chalk`

## Setup Instructions

1. **Clone the repository** and navigate to the project directory.

2. **Install dependencies** by running:

   ```sh
   npm install axios dotenv chalk
   ```

3. **Create a `.env` file** in the root of the project directory and add your OpenAI API key:

   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Run the script** using the following command:

   ```sh
   node conversation_builder.js
   ```

## Script Overview

- The script starts a conversation with an initial question, such as:

  ```
  How will AI shape the future of the world?
  ```

- It then generates responses and follow-up questions iteratively by making calls to OpenAI's API.
- After each response, the script saves the updated conversation to a JSON file in the `conversations` directory.
- System instructions for the answering agent and the follow-up prompts for the questioning agent are displayed at the start of the conversation for better transparency.
- The script estimates the costs for input, cached input, and output tokens based on the following rates:
  - **Input Tokens**: \$0.15 per million tokens
  - **Cached Input Tokens**: \$0.075 per million tokens
  - **Output Tokens**: \$0.60 per million tokens
- After each API call, the total input, cached input, and output tokens are tracked, and the estimated cost is displayed.

## Cost Estimation

- **Input Tokens**: \$0.15 per million tokens
- **Cached Input Tokens**: \$0.075 per million tokens
- **Output Tokens**: \$0.60 per million tokens

The script will provide real-time cost estimation based on the number of tokens used for each API call, including any cached tokens that reduce the overall cost.

## Folder Structure

- `conversations/` - Directory where the conversation files are saved.

## Notes

- The script will create the `conversations` directory if it does not exist.
- The script runs for a specified number of turns (`numberOfMessages`), simulating a conversation between the curious agent and the answering agent.
- The script supports up to 10 conversation turns by default, but this can be adjusted in the code by modifying the `numberOfMessages` variable.
- The final follow-up question is not sent, as there will be no response generated for it.

## License

This project is licensed under the MIT License.
