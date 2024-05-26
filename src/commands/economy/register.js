import { SlashCommandBuilder } from 'discord.js';
import User from "../../schemas/user.js";

export default {
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('Registers the user'),
  userPermissions: [],
  botPermissions: [],
  cooldown: 5, 
  nwfwMode: false,
  testMode: false,
  devOnly: false,

  run: async (client, interaction) => {
    try {
      const userId = interaction.user.id;

      // Check if the user is already registered
      const existingUser = await User.findOne({ id: userId });
  
      if (existingUser) {
        await interaction.reply({
          content: 'You are already registered.',
          ephemeral: true
        });
        return;

      }

      // If the user is not registered, create a new user document
      const newUser = new User({ id: userId });
      await newUser.save();

      // Provide registration confirmation
      await interaction.reply({
        content: 'You have been successfully registered!',
        ephemeral: true
      });

      // Follow-up message
      await interaction.followUp({
        content: 'Registration complete.',
        ephemeral: true
      });
    } catch (error) {
      console.error('Error occurred during registration:', error);
      await interaction.reply({
        content: 'An error occurred during registration. Please try again later.',
        ephemeral: true
      });
    }
  }
};
