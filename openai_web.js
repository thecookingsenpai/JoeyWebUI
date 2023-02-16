// Creating a class object for the OpenAI API
class OpenAI {
    constructor(apiKey, username) {
        this.apiKey = apiKey;
        this.username = username;
    }
    
    // Function to send a POST request to the OpenAI API
    async post(endpoint, data) {
        const url = `https://api.openai.com/v1/${endpoint}`;
        const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(data),
        });
        return response.json();
    }
    
    // Function to send a GET request to the OpenAI API
    async get(endpoint) {
        const url = `https://api.openai.com/v1/${endpoint}`;
        const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${this.apiKey}`,
        },
        });
        return response.json();
    }
    
    // Function to create a completion
    async createCompletion(prompt, 
                           model="text-davinci-003",
                           maxTokens=75, 
                           temperature=0.8, 
                           topP=1,
                           frequencyPenalty=0.4,
                           presencePenalty=0.8,
                           ) {
        // Compose  the stop (aka end of generation when the model sees this)
        let stop=[this.username + " >", "Joey >"];
        const data = {
            "model": model,
            "prompt": prompt, 
            "temperature": temperature,
            "max_tokens": maxTokens,
            "top_p": topP,
            "frequency_penalty": frequencyPenalty,
            "presence_penalty": presencePenalty,
            "stop": stop
        };
        const completion = await this.post("completions", data);
        return completion;
    }
}