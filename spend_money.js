// Script to iteratively build a conversation using OpenAI's API in JavaScript (Node.js)
// Requirements: Node.js, axios library, dotenv library, fs library

// Importing required libraries
import 'dotenv/config';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk'; // Using import for ESM compatibility with chalk

// OpenAI API configuration
const apiKey = process.env.OPENAI_API_KEY; // Read API Key from .env file
const apiUrl = 'https://api.openai.com/v1/chat/completions';

const initialQuestion = 'How will AI shape the future of the world?';
// const initialQuestion = 'What is the history behind the development of the internet?';
// const initialQuestion = 'Tell me something interesting about technology.';
const numberOfMessages = 10; // Number of conversation turns
const numberOfWordsToDisplay = 10; // Number of words to display per message

const answeringAgentSystemInstructions = "Please respond briefly and concisely to the user's question.";
const questioningAgentFollowUpPrompt =
  'Based on the previous conversation, generate a curious follow-up question that continues the discussion in an engaging way.';

// Function to generate a unique conversation ID
function generateConversationId() {
  return `conversation_${Date.now()}`;
}

// Function to update the conversation file after each API call
function updateConversationFile(conversationId, messages) {
  const folderPath = path.join(process.cwd(), 'conversations');
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  const filename = path.join(folderPath, `${conversationId}.json`);
  fs.writeFileSync(filename, JSON.stringify(messages, null, 2));
}

// Function for calculating token usage and cost
function calculateAndLogTokenUsage(response, callType, i, tokenUsage) {
  let inputTokensUsed = response.data.usage.prompt_tokens;
  let outputTokensUsed = response.data.usage.completion_tokens;
  let cachedTokensUsed = response.data.usage.cached_tokens || 0;
  tokenUsage.totalInputTokensUsed += inputTokensUsed;
  tokenUsage.totalOutputTokensUsed += outputTokensUsed;
  tokenUsage.totalCachedTokensUsed += cachedTokensUsed;

  let estimatedCost =
    (tokenUsage.totalInputTokensUsed - tokenUsage.totalCachedTokensUsed) * tokenUsage.costPerMillionInputTokens +
    tokenUsage.totalCachedTokensUsed * tokenUsage.costPerMillionCachedInputTokens +
    tokenUsage.totalOutputTokensUsed * tokenUsage.costPerMillionOutputTokens;

  console.log(
    chalk.dim(
      `${callType} API Call ${i + 1}:` +
        `Input tokens used = ${chalk.yellow(inputTokensUsed)}, ` +
        `Cached tokens used = ${chalk.cyan(cachedTokensUsed)}, ` +
        `Output tokens used = ${chalk.yellow(outputTokensUsed)}, ` +
        `Total input tokens used so far = ${chalk.magenta(tokenUsage.totalInputTokensUsed)}, ` +
        `Total cached tokens used so far = ${chalk.cyan(tokenUsage.totalCachedTokensUsed)}, ` +
        `Total output tokens used so far = ${chalk.magenta(tokenUsage.totalOutputTokensUsed)}, ` +
        `Estimated total cost so far = ${chalk.red(`$${estimatedCost.toFixed(4)}`)}`
    )
  );

  return tokenUsage;
}

// Function for the answering agent to generate a response
async function generateAnswer(messages) {
  const systemMessage = { role: 'system', content: answeringAgentSystemInstructions };
  const response = await axios.post(
    apiUrl,
    {
      model: 'gpt-4o-mini',
      messages: [systemMessage, ...messages],
      max_tokens: 500,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );
  return response;
}

// Function for the question agent to generate a follow-up question
async function generateFollowUpQuestion(messages) {
  const response = await axios.post(
    apiUrl,
    {
      model: 'gpt-4o-mini',
      messages: [...messages, { role: 'user', content: questioningAgentFollowUpPrompt }],
      max_tokens: 100,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );
  return response;
}

// Function to simulate a conversation between two agents
async function buildConversation() {
  console.log(chalk.dim('Starting a new conversation with system instructions...'));
  console.log(chalk.dim(`System instruction for the answering agent: ${answeringAgentSystemInstructions}`));
  console.log(chalk.dim(`Follow-Up prompt for the questioning agent: ${questioningAgentFollowUpPrompt}\n`));
  console.log(chalk.white(`${chalk.green(`Initial Question: `)}${initialQuestion}\n`));
  let conversationId = generateConversationId();
  let messages = [{ role: 'user', content: initialQuestion }];

  let tokenUsage = {
    totalInputTokensUsed: 0,
    totalOutputTokensUsed: 0,
    totalCachedTokensUsed: 0,
    costPerMillionInputTokens: 0.15 / 1000000, // Cost for GPT-4o-mini input tokens
    costPerMillionCachedInputTokens: 0.075 / 1000000, // Cost for GPT-4o-mini cached input tokens
    costPerMillionOutputTokens: 0.6 / 1000000, // Cost for GPT-4o-mini output tokens
  };

  try {
    for (let i = 0; i < numberOfMessages - 1; i++) {
      // Generate assistant's response
      let response = await generateAnswer(messages);

      tokenUsage = calculateAndLogTokenUsage(response, 'API Call', i, tokenUsage);

      // Get the response from the assistant
      const assistantResponse = response.data.choices[0].message.content;
      const truncatedAssistantResponse = assistantResponse.split(' ').slice(0, numberOfWordsToDisplay).join(' ');
      const assistantDisplayText =
        assistantResponse.split(' ').length > numberOfWordsToDisplay
          ? `${truncatedAssistantResponse}...`
          : truncatedAssistantResponse;
      console.log(chalk.white(`${chalk.green(`\nAssistant's response: `)}${assistantDisplayText}\n`));

      messages.push({ role: 'assistant', content: assistantResponse });

      // Update the conversation file
      updateConversationFile(conversationId, messages);

      // Generate follow-up question from the curious agent if it's not the last turn
      if (i < numberOfMessages - 2) {
        response = await generateFollowUpQuestion(messages);
        tokenUsage = calculateAndLogTokenUsage(response, 'Follow-up API Call', i, tokenUsage);

        // Get the follow-up question from the curious agent
        const followUp = response.data.choices[0].message.content;
        const truncatedFollowUp = followUp.split(' ').slice(0, numberOfWordsToDisplay).join(' ');
        const followUpDisplayText =
          followUp.split(' ').length > numberOfWordsToDisplay ? `${truncatedFollowUp}...` : truncatedFollowUp;
        console.log(chalk.white(`${chalk.green(`\nFollow-up question: `)}${followUpDisplayText}\n`));

        messages.push({ role: 'user', content: followUp });

        // Update the conversation file
        updateConversationFile(conversationId, messages);
      }
    }
  } catch (error) {
    console.error(chalk.red('Error in API call:'), error.response ? error.response.data : error.message);
  }
}

// Run the function
buildConversation();
