### Documentation

**Overview**:
This module provides functions to dynamically load, register, and handle event files for a Discord bot using the Discord.js library. It scans event folders, loads event files, registers event handlers, and attaches them to the Discord client, ensuring proper error handling.

**Parameters**:
- `eventRegistry` (Map): A map where event names are keys and their respective handlers are values.
- `eventName` (string): The name of the event to register.
- `eventInfo` (Object): Information about the event handler, including the function, file name, and priority.
- `eventFile` (string): The path to the event file.
- `errorHandler` (Function): The error handler function to call when errors occur.
- `eventFolder` (string): The path to the folder containing event files.
- `client` (Object): The Discord client instance.

**Returns**:
- The functions in this module do not return values; they perform operations such as registering event handlers and attaching them to the Discord client.

**Examples**:
```javascript
import loadEventHandlers from './path/to/eventLoader';
import { Client } from 'discord.js';
import DiscordBotErrorHandler from './handlers/errorHandler';

const client = new Client({ intents: [...] });
const errorHandler = new DiscordBotErrorHandler({ webhookUrl: process.env.ERROR_WEBHOOK_URL });

loadEventHandlers(client, errorHandler).then(() => {
   console.log('Event handlers loaded successfully.');
}).catch((error) => {
   console.error('Failed to load event handlers:', error);
});
```

**Notes**:
- **Environment Setup**: Ensure that the necessary environment variables (e.g., `ERROR_WEBHOOK_URL`) are set before running the script.
- **File Structure**: The event files should be organized in folders within the `events` directory. Each folder corresponds to an event name.
- **Priority Handling**: Event handlers can specify a `priority` property, determining the order in which they are executed. Higher priority handlers are executed first.
- **Error Handling**: The `errorHandler` function is used to handle and log errors that occur during the loading and execution of event handlers.
- **Edge Cases**:
  - If an event file fails to load, the error is caught, logged, and handled without crashing the application.
  - If an event handler throws an error during execution, the error is caught, logged, and handled appropriately.
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
