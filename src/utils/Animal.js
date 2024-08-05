import mongoose from 'mongoose';
import animalJson from '../assets/data/animal.js' 

// Mongoose Schema
const animalSchema = new mongoose.Schema({
  name: String,
  alt: [String],
  description: String,
  rank: String,
  hp: Number,
  att: Number,
  pr: Number,
  wp: Number,
  mag: Number,
  mr: Number,
});

const AnimalModel = mongoose.model('Animal', animalSchema);

class Animal {
  constructor(rawAnimal) {
    this.description = rawAnimal.description;
    this.rank = rawAnimal.rank;
    this.alt = rawAnimal.alt;
    this.value = rawAnimal.name;
    this.emoji = rawAnimal.name;
    this.name = this.alt[0];
    this.hp = this.hpr = rawAnimal.hp;
    this.att = this.attr = rawAnimal.att;
    this.pr = this.prr = rawAnimal.pr;
    this.wp = this.wpr = rawAnimal.wp;
    this.mag = this.magr = rawAnimal.mag;
    this.mr = this.mrr = rawAnimal.mr;
  }

  setRank(rank) {
    this.rank = rank.rank;
    this.price = rank.price;
    this.points = rank.points;
    this.essence = rank.essence;
  }
}

class AnimalRank {
  constructor(rank, rankData) {
    this.id = rank;
    this.rank = rank;
    this.name = rank;
    this.emoji = rankData.emoji;
    this.alias = [rank, ...rankData.alias];
    this.price = rankData.price;
    this.points = rankData.points;
    this.essence = rankData.essence;
    this.animals = [];
    this.tempAnimals = [];
    this.placeholder = rankData.placeholder;
    this.conditional = rankData.conditional;
    this.rarity = rankData.rarity;
    this.xp = rankData.xp;
    this.order = rankData.order;
  }

  addAnimal(animal) {
    this.animals.push(animal.value);
    animal.setRank(this);
  }

  addAnimalToTemp(animal) {
    this.tempAnimals.push(animal.value);
    animal.setRank(this);
  }

  useTemp() {
    this.animals = this.tempAnimals;
    this.tempAnimals = [];
  }
}

class AnimalJson {
  constructor() {
    this.animalNameToKey = {};
    this.animals = {};
    this.order = [];
    this.ranks = {};
    this.rankNameToKey = {};
  }

  async initialize() {
    try {
      const animals = await AnimalModel.find({}).exec();
      animals.forEach(this.parseAnimal);
      Object.entries(animalJson.ranks).forEach(([rankName, rankData]) => this.parseRank(rankName, rankData));
      this.updateAnimalsAndRanks();

      this.order = Object.keys(animalJson.ranks).sort((a, b) => animalJson.ranks[a].order - animalJson.ranks[b].order);
    } catch (error) {
      console.error('Error initializing AnimalJson:', error);
    }
  }

  async reinitialize(animalName) {
    if (animalName) {
      animalName = this.animalNameToKey[animalName.toLowerCase()] || animalName;
      return this.reinitializeAnimal(animalName);
    }
    await this.initialize();
  }

  async reinitializeAnimal(animalName) {
    try {
      const animal = await AnimalModel.findOne({ name: animalName }).exec();
      if (animal) {
        this.parseAnimal(animal);
        this.updateAnimalsAndRanks();
      } else {
        console.warn(`Animal not found: ${animalName}`);
      }
    } catch (error) {
      console.error(`Error reinitializing animal ${animalName}:`, error);
    }
  }

  parseAnimal = (rawAnimal) => {
    const animal = new Animal(rawAnimal);
    this.addAnimalKeyMap(animal);
    this.animals[animal.value] = animal;
  };

  parseRank = (rankName, rankData) => {
    const rank = new AnimalRank(rankName, rankData);
    this.addRankKeyMap(rank);
    this.ranks[rank.id] = rank;
  };

  updateAnimalsAndRanks() {
    Object.values(this.animals).forEach((animal) => {
      const rank = this.getRank(animal.rank);
      rank?.addAnimalToTemp(animal);
    });

    Object.values(this.ranks).forEach((rank) => {
      rank.useTemp();
    });
  }

  getRank(rankName) {
    const key = this.rankNameToKey[rankName?.toLowerCase() ?? ''];
    return this.ranks[key];
  }

  getOrder() {
    return this.order;
  }

  getRanks() {
    return this.ranks;
  }

  getAnimal(animalName) {
    const key = this.animalNameToKey[animalName?.toLowerCase() ?? ''];
    return this.animals[key];
  }

  addAnimalKeyMap(animal) {
    animal.alt.forEach((value) => {
      this.animalNameToKey[value.toLowerCase()] = animal.value;
    });
    this.animalNameToKey[animal.value.toLowerCase()] = animal.value;
  }

  addRankKeyMap(rank) {
    rank.alias.forEach((value) => {
      this.rankNameToKey[value.toLowerCase()] = rank.id;
    });
    this.rankNameToKey[rank.id.toLowerCase()] = rank.id;
  }
}

const animalJsonInstance = new AnimalJson();
await animalJsonInstance.initialize();

export default animalJsonInstance;