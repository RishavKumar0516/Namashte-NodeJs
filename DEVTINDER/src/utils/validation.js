const validator = require("validator");

const validateSignUpData = (req) => {
    const { firstName, lastName, emailId, password } = req.body;


    if (!firstName || !lastName) {
        throw new Error("First Name and Last Name is required");
    }

    else if (!validator.isEmail(emailId)) {
        throw new Error("EmailId is not valid");
    } else if (!validator.isStrongPassword(password)) {
        throw new Error("Please enter a strong password");
    }
}

const validateEditProfileData = (req) => {
    const allowedEditProfileData = ["gender", "age", "about", "skills", "photoUrl"];

    const isAllowed = Object.keys(req.body).every(field => allowedEditProfileData.includes(field))
    return isAllowed;
}

module.exports = {
    validateSignUpData,
    validateEditProfileData
}