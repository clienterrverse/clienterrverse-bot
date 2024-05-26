import  { Schema, model } from "mongoose";

const DailyRewardSchema = new Schema({
    time: {
        type: Number,
        default: 0,
        required: true
    },
    amount: {
        type: Number,
        default: 0,
        required: true
    },
    streak: {
        type: Number,
        default: 0,
        required: true
    },
    money: {
        from: {
            type: Number,
            default: 0,
            required: true
        },
        to: {
            type: Number,
            default: 0,
            required: true
        }
    }
});



const UserSchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    clienterrcoins: {
        type: Number,
        default: 10,
        required: true
    },
    coinFlipLastUsed: {
        type: Number,
        default: 0,
        required: true
    },
    daily: {
        type: [DailyRewardSchema], // Use the DailyRewardSchema defined above
        default: [],
        required: true
    }
});

export default model("User", UserSchema);