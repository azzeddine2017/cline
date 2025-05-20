// English translations
export const en = {
	// Common
	"common.loading": "Loading...",
	"common.error": "Error",
	"common.success": "Success",
	"common.cancel": "Cancel",
	"common.save": "Save",
	"common.close": "Close",
	"common.done": "Done",
	"common.edit": "Edit",
	"common.delete": "Delete",
	"common.search": "Search",
	"common.submit": "Submit",
	"common.back": "Back",
	"common.next": "Next",
	"common.previous": "Previous",
	"common.yes": "Yes",
	"common.no": "No",
	"common.ok": "OK",
	"common.settings": "Settings",
	"common.help": "Help",
	"common.about": "About",
	"common.customInstructions": "Custom Instructions",
	"common.customInstructionsPlaceholder":
		'e.g. "Run unit tests at the end", "Use TypeScript with async/await", "Speak in Spanish"',
	"common.customInstructionsDescription":
		"These instructions are added to the end of the system prompt sent with every request.",
	"common.separateModels": "Use different models for Plan and Act modes",
	"common.separateModelsDescription":
		"Switching between Plan and Act mode will persist the API and model used in the previous mode. This may be helpful e.g. when using a strong reasoning model to architect a plan for a cheaper coding model to act on.",
	"common.telemetry": "Allow anonymous error and usage reporting",
	"common.telemetryDescription":
		"Help improve Cline by sending anonymous usage data and error reports. No code, prompts, or personal information are ever sent.",
	"common.planMode": "Plan Mode",
	"common.actMode": "Act Mode",

	// Welcome View
	"welcome.title": "Hi, I'm Cline",
	"welcome.description":
		"I can do all kinds of tasks thanks to breakthroughs in Claude 3.7 Sonnet's agentic coding capabilities and access to tools that let me create & edit files, explore complex projects, use a browser, and execute terminal commands (with your permission, of course). I can even use MCP to create new tools and extend my own capabilities.",
	"welcome.getStarted": "Get Started",

	// Home Header
	"home.whatCanIDo": "What can I do for you?",
	"home.capabilities":
		"I can develop software step-by-step by editing files, exploring projects, running commands, and using browsers. I can even extend my capabilities with MCP tools to assist beyond basic code completion.",

	// Chat View
	"chat.placeholder": "Message Cline...",
	"chat.send": "Send",
	"chat.retry": "Retry",
	"chat.stop": "Stop",
	"chat.thinking": "Thinking...",
	"chat.generating": "Generating...",
	"chat.regenerate": "Regenerate",
	"chat.copyCode": "Copy code",
	"chat.copyResponse": "Copy response",

	// Settings View
	"settings.title": "Settings",
	"settings.api": "API",
	"settings.model": "Model",
	"settings.provider": "Provider",
	"settings.apiKey": "API Key",
	"settings.temperature": "Temperature",
	"settings.maxTokens": "Max Tokens",
	"settings.preferredLanguage": "Preferred Language",
	"settings.preferredLanguageDescription": "The language that Cline should use for communication.",
	"settings.theme": "Theme",
	"settings.autoApprove": "Auto Approve",
	"settings.save": "Save Settings",

	// Auto Approve Menu
	"autoApprove.enable": "Enable auto-approve",
	"autoApprove.toggleAll": "Toggle all",
	"autoApprove.readFiles": "Read project files",
	"autoApprove.readAllFiles": "Read all files",

	// Slash Commands
	"slashCommands.newtask": "Create a new task with context from the current task",
	"slashCommands.smol": "Condenses your current context window",
	"slashCommands.newrule": "Create a new Cline rule based on your conversation",
	"slashCommands.reportbug": "Create a Github issue with Cline",

	// Rules
	"rules.title": "Cline Rules",
	"rules.description": "Rules help Cline understand how you want it to behave",
	"rules.create": "Create Rule",
	"rules.edit": "Edit Rule",
	"rules.delete": "Delete Rule",
	"rules.name": "Rule Name",
	"rules.content": "Rule Content",
	"rules.save": "Save Rule",
	"rules.cancel": "Cancel",
	"rules.noRules": "No rules yet. Create one to get started!",

	// Context
	"context.addFile": "Add File",
	"context.addFolder": "Add Folder",
	"context.addUrl": "Add URL",
	"context.addProblems": "Add Problems",
	"context.addTerminal": "Add Terminal",
	"context.search": "Search files...",

	// Browser
	"browser.launch": "Launch Browser",
	"browser.navigate": "Navigate",
	"browser.refresh": "Refresh",
	"browser.back": "Back",
	"browser.forward": "Forward",
	"browser.close": "Close Browser",

	// Terminal
	"terminal.execute": "Execute Command",
	"terminal.stop": "Stop Command",
	"terminal.clear": "Clear Terminal",

	// Prompts
	"prompt.default":
		"I'm an AI assistant called Cline. I can help you with coding tasks, answer questions, and provide information.",
	"prompt.systemMessage": "You are Cline, an AI assistant that helps with coding and software development tasks.",
	"prompt.userMessage": "Hello, I need help with my project.",
	"prompt.assistantMessage": "Hi there! I'd be happy to help with your project. What are you working on?",

	// Advanced Systems Settings
	"settings.advancedSystems.title": "Advanced Systems",
	"settings.advancedSystems.enable": "Enable Advanced Systems",
	"settings.advancedSystems.enableDescription": "Enables advanced systems for code analysis, learning, memory, and parallel task execution.",
	"settings.advancedSystems.enableCodeAnalyzer": "Enable Code Analyzer",
	"settings.advancedSystems.enableCodeAnalyzerDescription": "Analyzes your code to provide better suggestions and insights.",
	"settings.advancedSystems.enableLearningSystem": "Enable Learning System",
	"settings.advancedSystems.enableLearningSystemDescription": "Learns from your interactions to improve future suggestions.",
	"settings.advancedSystems.enableMemorySystem": "Enable Memory System",
	"settings.advancedSystems.enableMemorySystemDescription": "Remembers concepts, patterns, and preferences across sessions.",
	"settings.advancedSystems.enableParallelTaskExecutor": "Enable Parallel Task Executor",
	"settings.advancedSystems.enableParallelTaskExecutorDescription": "Executes multiple tasks in parallel for better performance.",
	"settings.advancedSystems.maxConcurrentTasks": "Maximum Concurrent Tasks",
	"settings.advancedSystems.maxConcurrentTasksDescription": "Maximum number of tasks that can be executed in parallel.",
	"settings.advancedSystems.maxRetries": "Maximum Retries",
	"settings.advancedSystems.maxRetriesDescription": "Maximum number of retries for failed tasks."
}
