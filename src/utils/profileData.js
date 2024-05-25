import profileModel from "../schemas/profileSchema.js"

export default  {
  getProfileData: async (interaction) => {
    try {
      let profileData = await profileModel.findOne({ userId: interaction.user.id });
      if (!profileData) {
        profileData = await profileModel.create({
          userId: interaction.user.id,
          serverId: interaction.guild.id,
        });
      }
      return profileData;
    } catch (err) {
      console.error("Error retrieving or creating profile data:", err);
    }
  }
};
