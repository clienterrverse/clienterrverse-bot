# Discord.js Pagination Function

This function creates an interactive paginated embed message for Discord.js applications, allowing users to navigate through multiple pages of content easily.

## Features

- Interactive navigation buttons (Previous, Home, Next)
- Customizable button emojis and styles
- Automatic button state management (enabling/disabling based on current page)
- Page caching for improved performance
- Automatic timeout to remove interactivity after a set duration
- User-specific interaction (only the command initiator can use the buttons)
- Error handling and logging

## Usage

Import the pagination function in your command file:

```javascript
import pagination from '../../utils/buttonPagination.js';

// Inside a command or event handler:
async execute(interaction) {
  const pages = [
    new EmbedBuilder().setDescription('Page 1 content').setColor('#FF0000'),
    new EmbedBuilder().setDescription('Page 2 content').setColor('#00FF00'),
    new EmbedBuilder().setDescription('Page 3 content').setColor('#0000FF'),
  ];

  await pagination(interaction, pages);
}
```

## Function Signature

```javascript
pagination(interaction, pages, time?, buttonEmojis?, buttonStyles?)
```

### Parameters

| Parameter      | Type             | Description                                    | Default   |
| -------------- | ---------------- | ---------------------------------------------- | --------- |
| `interaction`  | `Interaction`    | The Discord.js interaction object              | Required  |
| `pages`        | `EmbedBuilder[]` | An array of EmbedBuilder objects               | Required  |
| `time`         | `number`         | Duration in milliseconds for active pagination | 30000     |
| `buttonEmojis` | `Object`         | Custom emojis for pagination buttons           | See below |
| `buttonStyles` | `Object`         | Custom styles for pagination buttons           | See below |

### Default Button Emojis

```javascript
{
  prev: '⬅️',
  home: '🏠',
  next: '➡️'
}
```

### Default Button Styles

```javascript
{
  prev: ButtonStyle.Primary,
  home: ButtonStyle.Secondary,
  next: ButtonStyle.Primary
}
```

## Customization

You can customize button emojis and styles:

```javascript
const customEmojis = {
  prev: '◀️',
  home: '🏠',
  next: '▶️',
};

const customStyles = {
  prev: ButtonStyle.Secondary,
  home: ButtonStyle.Primary,
  next: ButtonStyle.Secondary,
};

await pagination(interaction, pages, 60000, customEmojis, customStyles);
```

## How It Works

1. The function creates an interactive message with the first embed and navigation buttons.
2. Users can navigate through pages using "Previous", "Home", and "Next" buttons.
3. The message updates with new content when a button is clicked.
4. Button states are automatically managed (e.g., "Previous" is disabled on the first page).
5. Embeds are cached for improved performance on subsequent views.
6. Pagination automatically ends after the specified time, removing interactive buttons.
7. Only the user who initiated the command can use the pagination buttons.

## Error Handling

- The function includes error handling for invalid interactions or page arrays.
- Errors are logged to the console for debugging purposes.
- A user-friendly error message is sent as an ephemeral reply if possible.

## Advanced Usage

### Combining with Command Handling

```javascript
import { SlashCommandBuilder } from 'discord.js';
import pagination from '../../utils/buttonPagination.js';

export default {
  data: new SlashCommandBuilder()
    .setName('multipage')
    .setDescription('Displays a multi-page embed'),
  async execute(interaction) {
    const pages = [
      new EmbedBuilder().setDescription('Page 1').setColor('#FF0000'),
      new EmbedBuilder().setDescription('Page 2').setColor('#00FF00'),
      new EmbedBuilder().setDescription('Page 3').setColor('#0000FF'),
    ];

    await pagination(interaction, pages);
  },
};
```

### Using with Deferred Replies

The pagination function automatically defers the reply if it hasn't been deferred yet. If you need to defer earlier (e.g., for long-running operations before creating the embeds), you can do so:

```javascript
// Perform time-consuming operations
const pages = await generatePages();
await pagination(interaction, pages);
```

## Performance Considerations

- The function uses a `Map` to cache formatted pages, reducing processing time for frequently viewed pages.
- Button collectors are set up only once, minimizing the number of listeners.

## Limitations

- The function is designed for use with Discord.js v14 and may need adjustments for other versions.
- The maximum number of pages is not limited by the function, but Discord has a limit on the number of embeds that can be sent in a single message.
