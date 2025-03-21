document.addEventListener("DOMContentLoaded", function () {
  // DOM elements
  const ideaForm = document.getElementById("idea-form");
  const ideaSection = document.getElementById("idea-input");
  const processingSection = document.getElementById("processing");
  const resultsSection = document.getElementById("results");
  const errorSection = document.getElementById("error");
  const statusMessage = document.getElementById("status-message");
  const progressFill = document.getElementById("progress-fill");
  const currentStep = document.getElementById("current-step");
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabPanes = document.querySelectorAll(".tab-pane");
  const errorMessage = document.getElementById("error-message");
  const tryAgainButton = document.getElementById("try-again");
  const downloadTxtButton = document.getElementById("download-txt");
  const costSummary = document.getElementById("cost-summary");

  // State variables
  let currentStepIndex = 0;
  let totalApiCost = 0;
  let results = {};

  // Product development steps
  const developmentSteps = [
    "Analyzing and validating your idea...",
    "Developing product strategy...",
    "Creating product design...",
    "Planning technical implementation...",
    "Creating implementation code...",
  ];

  // Form submission handler
  ideaForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const idea = document.getElementById("idea").value.trim();
    const apiKey = document.getElementById("api-key").value.trim();

    if (!idea) {
      alert("Please enter your product idea");
      return;
    }

    if (!apiKey || !apiKey.startsWith("sk-ant-")) {
      alert("Please provide a valid Claude API key");
      return;
    }

    // Clear previous results
    results = {};
    totalApiCost = 0;

    // Show processing section
    ideaSection.classList.add("hidden");
    errorSection.classList.add("hidden");
    processingSection.classList.remove("hidden");

    // Reset progress
    currentStepIndex = 0;
    updateProgress();

    // Start the product development pipeline
    runProductDevelopment(idea, apiKey);
  });

  // Tab switching
  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Remove active class from all buttons and panes
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabPanes.forEach((pane) => pane.classList.remove("active"));

      // Add active class to clicked button and corresponding pane
      button.classList.add("active");
      const tabId = button.getAttribute("data-tab");
      document.getElementById(tabId).classList.add("active");
    });
  });

  // Try again button
  tryAgainButton.addEventListener("click", function () {
    errorSection.classList.add("hidden");
    ideaSection.classList.remove("hidden");
  });

  // Update progress display
  function updateProgress() {
    const progressPercent =
      (currentStepIndex / (developmentSteps.length - 1)) * 100;
    progressFill.style.width = `${progressPercent}%`;
    currentStep.textContent = developmentSteps[currentStepIndex];
  }

  // Show error message
  function showError(message) {
    processingSection.classList.add("hidden");
    resultsSection.classList.add("hidden");
    errorSection.classList.remove("hidden");
    errorMessage.textContent = message;
  }

  // Call Claude API
  async function callClaudeAPI(apiKey, prompt) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 4000,
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Calculate cost (Claude Haiku pricing: $0.25/M tokens input, $1.25/M tokens output)
      const inputTokens = data.usage?.input_tokens || 0;
      const outputTokens = data.usage?.output_tokens || 0;
      const inputCost = inputTokens * 0.00000025;
      const outputCost = outputTokens * 0.00000125;
      const callCost = inputCost + outputCost;
      
      totalApiCost += callCost;
      
      // Update cost display
      costSummary.textContent = `API Cost: $${totalApiCost.toFixed(4)}`;
      
      return {
        content: data.content[0].text,
        cost: callCost
      };
    } catch (error) {
      console.error("API call failed:", error);
      throw error;
    }
  }

  // Run the product development pipeline
  async function runProductDevelopment(idea, apiKey) {
    try {
      // Step 1: Market validation
      currentStepIndex = 0;
      updateProgress();
      statusMessage.textContent = "Analyzing your idea and validating market potential...";
      
      const marketValidationPrompt = `
You are a skilled Market Research Analyst on a product development team. Analyze this product idea:

${idea}

Create a concise market validation analysis that includes:
1. Market viability and potential
2. Target audience and their specific needs
3. Market size and growth potential
4. Current competitors and their weaknesses
5. Potential barriers to entry
6. Revenue potential and timeline to profitability

Format your response as a professional market analysis report. Be concise but thorough.
`;

      const marketValidation = await callClaudeAPI(apiKey, marketValidationPrompt);
      results.marketValidation = marketValidation.content;
      
      // Step 2: Product strategy
      currentStepIndex = 1;
      updateProgress();
      statusMessage.textContent = "Developing product strategy...";
      
      const productStrategyPrompt = `
You are an experienced Product Strategist. Based on this market validation analysis:

${results.marketValidation}

Develop a focused product strategy that includes:
1. Clear product vision and value proposition (1-2 sentences)
2. Core features for the MVP (list only 3-5 essential features)
3. Key differentiators from competitors (1-2 points)
4. Go-to-market strategy (very brief)
5. Timeline for development and launch (compressed and realistic)

Be extremely specific and practical about the product's functionality.
Format your response as a professional product strategy document.
`;

      const productStrategy = await callClaudeAPI(apiKey, productStrategyPrompt);
      results.productStrategy = productStrategy.content;
      
      // Step 3: Product design
      currentStepIndex = 2;
      updateProgress();
      statusMessage.textContent = "Creating product design...";
      
      const productDesignPrompt = `
You are a talented Product Designer. Based on this product strategy:

${results.productStrategy}

Create a streamlined product design document that includes:
1. 1 primary user persona with basic demographics, goals and pain points
2. Simple user flow diagram (describe it in text)
3. List of key screens/pages (no more than 5)
4. For each screen, list ONLY:
   - Purpose of the screen
   - Key elements/components
   - Primary user actions

Focus on creating a minimal, intuitive user experience that directly addresses user needs.
Format your response as a professional product design document.
`;

      const productDesign = await callClaudeAPI(apiKey, productDesignPrompt);
      results.productDesign = productDesign.content;
      
      // Step 4: Technical implementation plan
      currentStepIndex = 3;
      updateProgress();
      statusMessage.textContent = "Planning technical implementation...";
      
      const technicalPlanPrompt = `
You are a skilled Software Engineer. Based on this product strategy and design:

Product Strategy:
${results.productStrategy}

Product Design:
${results.productDesign}

Develop a lean technical implementation plan that includes:
1. Technology stack (choose FREE, widely-used technologies only)
   - Frontend: HTML/CSS/JavaScript with minimal frameworks
   - Backend: If needed, choose the simplest possible solution
   - Data storage: Local storage or simple free tier options
2. System architecture (keep it extremely simple)
3. Development approach (focus on rapid implementation)
4. Key technical challenges and simple solutions

Focus on creating the most minimal implementation that delivers the core value.
Format your response as a professional technical specification document.
`;

      const technicalPlan = await callClaudeAPI(apiKey, technicalPlanPrompt);
      results.technicalPlan = technicalPlan.content;
      
      // Step 5: Implementation code
      currentStepIndex = 4;
      updateProgress();
      statusMessage.textContent = "Creating implementation code...";
      
      const implementationPrompt = `
You are an expert Software Engineer. Based on this technical plan:

${results.technicalPlan}

Create the actual MVP code for the product. Focus on:
1. The main HTML structure (index.html)
2. Basic CSS styling (style.css)
3. Core JavaScript functionality (script.js)

Provide complete, working code files that implement the core functionality described in the technical plan.
Each file should be properly formatted and ready to use.

Format your response with clear file headers like:
--- index.html ---
(code here)

--- style.css ---
(code here)

--- script.js ---
(code here)
`;

      const implementation = await callClaudeAPI(apiKey, implementationPrompt);
      results.implementation = implementation.content;
      
      // Create summary
      const summaryPrompt = `
You are a Project Manager overseeing a product development team. Based on all the work done:

Market Validation:
${results.marketValidation.substring(0, 500)}...

Product Strategy:
${results.productStrategy.substring(0, 500)}...

Product Design:
${results.productDesign.substring(0, 500)}...

Technical Plan:
${results.technicalPlan.substring(0, 500)}...

Create an executive summary of the product (1 page maximum) that includes:
1. Product overview and key value proposition
2. Target market and opportunity size
3. Core features and differentiators
4. Technical implementation approach
5. Next steps for launch

Format this as a professional executive summary that a stakeholder could quickly read to understand the entire project.
`;

      const summary = await callClaudeAPI(apiKey, summaryPrompt);
      results.summary = summary.content;
      
      // Display results
      displayResults();
      
    } catch (error) {
      showError(`Error: ${error.message}`);
    }
  }
  
  // Display results
  function displayResults() {
    processingSection.classList.add("hidden");
    resultsSection.classList.remove("hidden");
    
    // Update summary tab
    document.getElementById("summary-content").textContent = results.summary || "Summary not available";
    
    // Update strategy tab
    document.getElementById("strategy-content").textContent = results.productStrategy || "Strategy not available";
    
    // Update design tab
    document.getElementById("design-content").textContent = results.productDesign || "Design not available";
    
    // Update technical tab
    document.getElementById("technical-content").textContent = results.technicalPlan || "Technical plan not available";
    
    // Update implementation code tab
    document.getElementById("implementation-content").textContent = results.implementation || "Implementation code not available";
    
    // Update cost summary
    costSummary.textContent = `API Cost: $${totalApiCost.toFixed(4)}`;
  }
  
  // Download results as text
  downloadTxtButton.addEventListener("click", function() {
    if (!results || Object.keys(results).length === 0) {
      alert("No results available to download");
      return;
    }
    
    let content = "PRODUCT DEVELOPMENT RESULTS\n";
    content += "========================\n\n";
    
    content += "SUMMARY\n";
    content += "-------\n";
    content += results.summary + "\n\n";
    
    content += "MARKET VALIDATION\n";
    content += "----------------\n";
    content += results.marketValidation + "\n\n";
    
    content += "PRODUCT STRATEGY\n";
    content += "---------------\n";
    content += results.productStrategy + "\n\n";
    
    content += "PRODUCT DESIGN\n";
    content += "-------------\n";
    content += results.productDesign + "\n\n";
    
    content += "TECHNICAL IMPLEMENTATION PLAN\n";
    content += "----------------------------\n";
    content += results.technicalPlan + "\n\n";
    
    content += "IMPLEMENTATION CODE\n";
    content += "------------------\n";
    content += results.implementation + "\n\n";
    
    content += "API COST SUMMARY\n";
    content += "--------------\n";
    content += `Total API Cost: $${totalApiCost.toFixed(4)}\n`;
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product-development-results.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
});
