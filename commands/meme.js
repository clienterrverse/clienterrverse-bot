const { SlashCommandBuilder } = require("discord.js");

const memeLinks = [
  "https://tenor.com/view/clienterr-master-gm-fakepixel-gif-7181023276332288767",
  "https://tenor.com/view/clienterr-daddy-koban-fakepixel-gif-822805773092853525",
  "https://tenor.com/view/uwu-clienterr-daddy-dark-fakepixel-gif-17874169902583296365",
  "https://tenor.com/view/clienterrverse-clienterr-fakepixel-kobe-gif-3978810040281653181",
  "https://tenor.com/view/koban4ik-clienterr-fakepixel-cook-gif-247734035638604876",
  "https://tenor.com/view/clienterr-fakepixel-demo-pls-gif-10228665671878098589",
  "https://tenor.com/view/rule-1-fakepixel-rule-clienterr-clienterr-smash-fakepixel-gif-11287819569727263061",
  "https://tenor.com/view/promote-clienterr-fakepixel-koban-gif-10325616020765903574",
  "https://tenor.com/view/clienterr-fakepixel-koban-hypixel-gif-5627422119165137564",
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("meme")
    .setDescription("Sends a random meme"),
  async execute(interaction) {
    const randomMeme = memeLinks[Math.floor(Math.random() * memeLinks.length)];
    await interaction.reply(randomMeme);
  },
};
