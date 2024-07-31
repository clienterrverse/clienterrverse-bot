### Documentation

**Overview**:
This module provides a function to create a pagination system using buttons for Discord messages. It allows users to navigate through a series of embeds using buttons for first, previous, home, next, and last pages.

**Parameters**:
- `interaction` (Interaction): The interaction that triggered the pagination.
- `pages` (Array<EmbedBuilder>): An array of embeds to paginate.
- `time` (Number) [default=30000]: The time in milliseconds for the pagination to be active.
- `buttonEmojis` (Object) [default={ first: '⏮️', prev: '⬅️', home: '🏠', next: '➡️', last: '⏭️' }]: Emojis for the buttons.
  - `first` (string): Emoji for the "first" button.
  - `prev` (string): Emoji for the "previous" button.
  - `home` (string): Emoji for the "home" button.
  - `next` (string): Emoji for the "next" button.
  - `last` (string): Emoji for the "last" button.
- `buttonStyles` (Object) [default={ first: ButtonStyle.Primary, prev: ButtonStyle.Primary, home: ButtonStyle.Secondary, next: ButtonStyle.Primary, last: ButtonStyle.Primary }]: Styles for the buttons.
  - `first` (ButtonStyle): Style for the "first" button.
  - `prev` (ButtonStyle): Style for the "previous" button.
  - `home` (ButtonStyle): Style for the "home" button.
  - `next` (ButtonStyle): Style for the "next" button.
  - `last` (ButtonStyle): Style for the "last" button.

**Returns**:
- `Promise<Message>`: The message object that was edited to include pagination buttons.

**Examples**:
```javascript
import pagination from './path/to/pagination';
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('interactionCreate', async (interaction) => {
   if (!interaction.isCommand()) return;

   const pages = [
      new EmbedBuilder().setTitle('Page 1').setDescription('Content of Page 1'),
      new EmbedBuilder().setTitle('Page 2').setDescription('Content of Page 2'),
      new EmbedBuilder().setTitle('Page 3').setDescription('Content of Page 3'),
   ];

   await pagination(interaction, pages);
});

client.login('your-bot-token');
```

**Notes**:
- **Interaction Handling**: Ensure that the interaction  valid setting up pagination.
- **Edge Cases**:
  - If the `pages` array is empty or not provided, an error is thrown.
  - If there is only one page, the interaction is replied to without pagination buttons.
  - The function ensures that only the user who triggered the interaction can interact with the buttons.
- **Error Handling**: Errors during setup or interaction are caught and handled, providing feedback to the user if an error occurs.
- **Button States**: Button states are updated dynamically based on the current page index to disable buttons appropriately.

**Helper Functions**:
- `createButton(customId, emoji, style, disabled = false)`: Creates a button with the specified properties.
- `updateButtons(buttons, index, pagesLength)`: Updates the states (enabled/disabled) of buttons based on the current page index and the total number of pages.

**To-Do List**:
- Ensure proper integration with command handling and event listeners.
- Test the function with various use cases and scenarios to ensure stability.
- Explore additional features such as custom page limits and dynamic content loading.