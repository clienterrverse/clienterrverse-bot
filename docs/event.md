Here's the documentation for the event handler system:

# Discord.js Event Handler System

This system dynamically loads and registers event handlers for a Discord.js bot.

## Overview

The event handler system automatically scans a designated directory for event files and registers them with the Discord.js client. It supports multiple event files per event type and provides error handling for individual event files.

## Directory Structure

src\events\validations\chatInputCommandValidator.js

```markdown
clienterrverse/
├─src/
│ ├─events/
│ │ ├─ready/
│ │ │ └─onReady.js
│ │ ├─messageCreate/
│ │ │ └─logMessage.js
│ │ └─validations/
│ │ └─chatInputCommandValidator.js
│ └─handlers/
│ └─eventHandler.js
```

This structure visually represents your directory hierarchy with proper indentation and formatting.

## Creating a New Event

1. Create a new folder in the `events` directory with the name of the Discord.js event (e.g., `messageCreate`).
2. Inside this folder, create a JavaScript file for your event handler (e.g., `logMessage.js`).
3. In the event file, export a default async function that will handle the event:

```javascript
export default async (client, message) => {
   console.log(`New message received: ${message.content}`);
};
```

## Special Case: Validations

If you create a folder named `validations`, it will be treated as part of the `interactionCreate` event.

## How It Works

1. The system scans the `events` directory for subfolders.
2. Each subfolder name is treated as an event name (except `validations`).
3. All JavaScript files within these subfolders are loaded as event handlers.
4. The system registers these handlers with the Discord.js client.
5. When an event occurs, all handlers for that event are executed in the order they were loaded.

## Error Handling

-  If an individual event file fails to load or execute, an error message is logged, but other event handlers continue to function.
-  If there's an error in the overall setup process, it's caught and logged.

## Best Practices

1. Keep each event handler focused on a single responsibility.
2. Use descriptive names for your event files.
3. Handle errors gracefully within your event handlers.
4. Avoid heavy computations in event handlers to prevent blocking the event loop.

## Troubleshooting

-  If an event isn't firing, check that the correct event name is used for the folder.
-  Ensure that your bot has the necessary intents enabled for the events you're listening to.
-  Check the console for any error messages related to event loading.
