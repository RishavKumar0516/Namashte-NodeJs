const { JsonWebTokenError } = require("jsonwebtoken");
const mongoose = require("mongoose");
const validator = require("validator")
const { Schema } = mongoose;

const userSchema = new Schema({
    firstName: {
        type: String,
        required: true,
        minLength: 4,
        maxLength: 30
    },
    lastName: {
        type: String
    },
    emailId: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Email data is not valid")
            }
        }
    },
    password: {
        type: String,
        required: true,
        validate(value) {
            if (!validator.isStrongPassword(value)) {
                throw new Error("Password data is not valid")
            }
        }
    },
    age: {
        type: Number
    },
    gender: {
        type: String,
        validate(value) {
            if (!["male", "female", "others"].includes(value)) {
                throw new Error("Gender data is not valid")
            }
        }
    },
    photoUrl: {
        type: String,
        required: true,
        default: "https://www.google.com/imgres?q=dummy%20user%20full%20photo%20image&imgurl=https%3A%2F%2Fw7.pngwing.com%2Fpngs%2F695%2F655%2Fpng-transparent-head-the-dummy-avatar-man-tie-jacket-user.png&imgrefurl=https%3A%2F%2Fwww.pngwing.com%2Fen%2Ffree-png-vodjo&docid=V_2s5NrQwRrh0M&tbnid=Gw49iItPYgrOwM&vet=12ahUKEwie09HjnaCXAxUCg-EIHe5QG3cQnPAOegUI7wQQAA..i&w=920&h=920&hcb=2&ved=2ahUKEwie09HjnaCXAxUCg-EIHe5QG3cQnPAOegUI7wQQAA"
    },
    about: {
        type: String,
        default: "This is a default value for the user."
    },
    skills: {
        type: [String],
        default: ["communication", "teamwork", "problem solving"]
    }
},
    {
        timestamps: true
    })

userSchema.methods.getJWT = async function () {
    const token = jwt.sign({_id: this._id}, JWT_SECRET, {expiresIn: "1d"}) 
    return token;
}

const User = mongoose.model("User", userSchema);
module.exports = User;

