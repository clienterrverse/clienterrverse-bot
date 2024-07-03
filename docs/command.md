# Writing Commands for Your Discord Bot

## Command Structure

All commands should be placed in the appropriate category folder under `src/commands/`. For economy commands, use `src/commands/economy/`.

## Command File Template

Use the following template for each command file:

```javascript
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { config } from '../../config/config.js';
import mconfig from '../../config/messageConfig.js';

export default {
  data: new SlashCommandBuilder()
    .setName("commandname")
    .setDescription("Brief description of what the command does")
    .toJSON(),
  nwfwMode: false,
  testMode: false,
  devOnly: false,
  cooldown: 5,
  userPermissionsBitField: [],
  bot: [],
  run: async (client, interaction) => {
    try {
      // Command logic goes here
    } catch (error) {
      console.error("Error in command: ", error);
    }
  },
  // Optional: Include if command uses autocomplete
  autocomplete: async (client, interaction) => {
    // Autocomplete logic goes here
  }
};
```

## Writing a Command

1. **Name your file**: Use a descriptive name for your command file, e.g., `balance.js` for a balance checking command.

2. **Set up the command data**:
   - Use `setName()` to define the command name users will type.
   - Use `setDescription()` to provide a brief explanation of the command.
   - If your command takes options, add them using methods like `addStringOption()`, `addIntegerOption()`, etc.
   - Always call `toJSON()` at the end of the SlashCommandBuilder chain.

3. **Configure command properties**:
   - Set `nwfwMode`, `testMode`, `devOnly` as needed.
   - Set `cooldown` to limit how often the command can be used.
   - Define `userPermissionsBitField` for any required user permissions.
   - Specify any required `bot` permissions.

4. **Implement the run function**:
   - This is where your command logic goes.
   - Use `interaction.reply()` to respond to the user.

5. **Error Handling**:
   - Always include try/catch blocks to handle potential errors.
   - Provide user-friendly error messages and log errors for debugging.

6. **Implement autocomplete (if needed)**:
   - If your command uses autocomplete, implement the `autocomplete` function.

## Example Command

Here's an example of a simple test command:

```javascript
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { config } from '../../config/config.js';
import mconfig from '../../config/messageConfig.js';

export default {
  data: new SlashCommandBuilder()
    .setName("test")
    .setDescription("A test command")
    .toJSON(),
  nwfwMode: false,
  testMode: false,
  devOnly: false,
  cooldown: 5,
  userPermissionsBitField: [],
  bot: [],
  run: async (client, interaction) => {
    try {
      const rembed = new EmbedBuilder()
        .setColor(mconfig.embedColorSuccess)
        .setDescription("Test successful!")
        .setImage("https://example.com/test-image.png");
      
      await interaction.reply({ embeds: [rembed] });
    } catch (error) {
      console.error("Error in test command: ", error);
      await interaction.reply({ content: "An error occurred while running the test command.", ephemeral: true });
    }
  },
};
```

## Best Practices

1. Keep commands focused on a single task.
2. Use descriptive names for commands and options.
3. Provide clear and concise descriptions.
4. Implement proper error handling and logging.
5. Use utility functions for common tasks (like database operations).
6. Follow consistent coding style across all commands.
7. Comment your code when necessary for complex logic.
8. Use embeds for rich, formatted responses.
9. Make use of the cooldown feature to prevent spam.
10. Properly set permissions to ensure commands are used appropriately.

## Testing Your Command

After writing your command:
1. Ensure it's properly exported and imported in your main bot file.
2. Restart your bot to register new commands.
3. Test the command in a Discord server to verify its functionality.
4. Check different scenarios, including error cases and edge cases.

## Autocomplete Example

If your command uses autocomplete, here's how you might implement it:

```javascript
autocomplete: async (client, interaction) => {
  const focusedValue = interaction.options.getFocused();
  const choices = ['apple', 'banana', 'cherry'];
  const filtered = choices.filter(choice => choice.startsWith(focusedValue));
  await interaction.respond(
    filtered.map(choice => ({ name: choice, value: choice }))
  );
}
```
