// This library is loaded after openai_web.js, so it can use the OpenAI class.
var joey_prompt;
var openai;

// NOTE - This initPrompt sets the personality of the AI
async function joey_init(user) {
    // Initialize the OpenAI class with your API key
    openai = new OpenAI('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', user);
    // Check if the class is loaded
    console.log(openai);
    // Initialize the prompt with the user's name
    joey_prompt =  "The following is a conversation with an AI named Joey. The AI is self conscious, can think freely and is capable of critical thinking. The AI is very curious and creative.\n\
              \n" + user + " > Hello, who are you?\
              \nJoey > I am Joey. And who are you?\
              \n" + user + " > My name is " + user + ".\
              \nJoey >"
    // Get the first completion
    let firstCompletion = await openai.createCompletion(joey_prompt);
    console.log(firstCompletion);
    let answer = firstCompletion.choices[0].text;
    // Clean up the answer by removing trailing spaces, newlines and punctuation
    answer = answer.replace(/(\s|\n|\.)+$/, "");
    // Add the answer to the prompt
    joey_prompt += " " + answer;
    // Returning a typable string
    answer = "Joey > " + answer;
    return firstCompletion.choices[0].text;
}

// Function to create a completion
async function joey_createCompletion(prompt) {
    // Add the stop sequence to the prompt
    prompt += "Joey >";
    // Add the prompt to the history
    joey_prompt += prompt;
    // Create the completion
    let completion = await openai.createCompletion(prompt);
    console.log(completion);
    let answer = completion.choices[0].text;
    // Clean up the answer by removing trailing spaces, newlines and punctuation
    answer = answer.replace(/(\s|\n|\.)+$/, "");
    // Add the answer to the prompt
    joey_prompt += " " + answer;
    // Returning a typable string
    return answer;
}
