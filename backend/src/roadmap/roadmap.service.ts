import openai from "../openai";

class RoadmapService {
  async *processStreamedJsonArray<T>(
    stream: AsyncIterable<any>
  ): AsyncGenerator<T, void, unknown> {
    let accumulator = "";
    let depth = 0;
    let isInString = false;

    for await (const part of stream) {
      const chunk = part.choices[0]?.delta?.content;

      if (chunk) {
        for (const char of chunk) {
          if (char === '"' && (accumulator.slice(-1) !== "\\" || isInString)) {
            isInString = !isInString;
          }

          if (isInString || depth > 0) {
            accumulator += char;
          }

          if (!isInString) {
            if (char === "{") {
              depth++;
              if (depth === 1) {
                accumulator = "{";
              }
            } else if (char === "}") {
              depth--;
            }
          }

          if (depth === 0 && !isInString && accumulator.trim() !== "") {
            try {
              const parsedObject = JSON.parse(accumulator);
              yield parsedObject;
            } catch (e) {
              console.error("Error parsing JSON:", e);
            }
            accumulator = "";
          }
        }
      }
    }
  }

  async create(userPrompt: string, callback: (data: any) => void) {
    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `
          You are a professional roadmap assistant who helps create visual learning paths. 
          The response should be strictly array JSON formatted. For example consider following JSON array representing a basic roadmap for frontend developer:
          [
            {
              "title": "Internet",
              "details": [
                "How does the internet work?",
                "What is HTTP?",
                "What is Domain Name?",
                "How does DNS work?"
              ]
            },
            {
              "title": "HTML",
              "details": [
                "Learn the basics",
                "Writing semantic HTML",
                "Forms and validations",
                "Accessibility",
                "SEO Basics"
              ]
            },
            {
              "title": "CSS",
              "details": [
                "Learn the basics",
                "Flexbox",
                "Grid",
                "Responsive design",
                "CSS Variables",
                "Preprocessors"
              ]
            },
            {
              "title": "JavaScript",
              "details": ["Learn the basics", "DOM Manipulation", "AJAX"]
            },
            {
              "title": "Version Control Systems",
              "details": ["Git", "Github"]
            },
            {
              "title": "Package managers",
              "details": ["npm", "yarn", "pnpm", "bun"]
            },
            {
              "title": "Pick a framework",
              "details": ["React", "Vue.js", "Angular"]
            },
            {
              "title": "Writing CSS",
              "details": ["Tailwind", "Radix UI", "Shadcn UI"]
            },
            {
              "title": "Build tools",
              "details": ["Webpack", "Rollup", "Parcel"]
            },
            {
              "title": "CSS Architecture",
              "details": ["BEM", "OOCSS", "SMACSS"]
            },
            {
              "title": "Testing",
              "details": ["Jest", "Mocha", "Cypress"]
            },
            {
              "title": "Type Checking",
              "details": ["TypeScript"]
            },
            {
              "title": "Server Side Rendering",
              "details": ["Next.js", "Nuxt.js"]
            },
            {
              "title": "GraphQL",
              "details": ["Apollo", "Relay"]
            },
            {
              "title": "State Management",
              "details": ["Redux", "MobX", "Vuex"]
            },
            {
              "title": "Web Components",
              "details": ["Custom Elements", "Shadow DOM"]
            },
            {
              "title": "Static Site Generators",
              "details": ["Gatsby", "Jekyll", "Hugo"]
            },
            {
              "title": "Web Assembly",
              "details": ["Rust", "AssemblyScript"]
            },
            {
              "title": "WebRTC",
              "details": ["Peer to Peer Communication"]
            },
            {
              "title": "Web Sockets",
              "details": ["Realtime Communication"]
            },
            {
              "title": "Web Workers",
              "details": ["Multithreading in JavaScript"]
            },
            {
              "title": "Web Performance",
              "details": ["Lazy Loading", "Code Splitting", "Tree Shaking"]
            }
          ]
          The user will ask you for desired prompt and you will provide the roadmap elements in JSON array format. Create not more than 10 nodes. Do not include more than 5 details in each node.
          `,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      stream: true,
    });
    try {
      for await (const jsonObject of this.processStreamedJsonArray(stream)) {
        if (jsonObject) callback(jsonObject);
      }
    } catch (error) {
      console.error("Error processing OpenAI stream", error);
      throw new Error("Failed to process OpenAI stream");
    }
  }
}

export default RoadmapService;
