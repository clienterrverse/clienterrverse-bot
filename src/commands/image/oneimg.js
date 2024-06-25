import { SlashCommandBuilder } from 'discord.js';
import axios from 'axios';

export default {
  data: new SlashCommandBuilder()
    .setName('oneimg')
    .setDescription('Generate image with options')
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription('Type of image to generate')
        .setRequired(true)
        .setAutocomplete(true)
      )
    .addUserOption((option) =>
      option.setName('target').setDescription('User to apply effect to').setRequired(false)
    )
    .toJSON(),
  run: async (client, interaction) => {
    try {
      await interaction.deferReply();

      const typeImg = interaction.options.getString('type');
      const targetUser = interaction.options.getUser('target') || interaction.user;
      const avatarURL = targetUser.displayAvatarURL({ size: 512, format: 'jpg', dynamic: false });

      const response = await axios.get(`https://nekobot.xyz/api/imagegen?type=${typeImg}&image=${encodeURIComponent(avatarURL)}`);

      if (!response.data || !response.data.message) {
        throw new Error('Failed to generate image.');
      }


      await interaction.editReply(imageURL);

    } catch (error) {
      console.error('Error generating image:', error);
      
      // Determine how to reply based on whether interaction was deferred
      if (interaction.deferred) {
        await interaction.editReply('Sorry, something went wrong while generating the image.');
      } else {
        await interaction.reply('Sorry, something went wrong while generating the image.');
      }
    }
  },
  autocomplete: async (client, interaction) => {
    try {
        const input = interaction.options.getFocused(true); // Assuming this retrieves the user input correctly
        
        
        const choices = [
            { name: 'Threats', value: 'threats' },
            { name: 'Baguette', value: 'baguette' },
            { name: 'Clyde', value: 'clyde' },
            { name: 'Lolice', value: 'lolice' },
            { name: 'iPhone X', value: 'iphonex' },
            { name: 'KMS', value: 'kms' },
            { name: 'Awooify', value: 'awooify' },
            { name: 'Kidnap', value: 'kidnap' },
            { name: 'Deepfry', value: 'deepfry' },
            { name: 'Blurpify', value: 'blurpify' },
        ];

        // Filter autocomplete options based on user input
        const filtered = choices.filter(choice => choice.name.toLowerCase().startsWith(input.toLowerCase()));

        // Map the filtered options to Discord's autocomplete format
        const autocompleteOptions = filtered.map(option => ({
            name: option.name,
            value: option.value
        }));

        // Respond with the autocomplete options
        await interaction.respond({
            type: 8, // Type 8 represents Autocomplete result
            data: {
                choices: autocompleteOptions
            }
        });

    } catch (error) {
        console.error('Error handling autocomplete:', error);
        // Handle errors appropriately, possibly send an error message back to the user
    }
}


};
