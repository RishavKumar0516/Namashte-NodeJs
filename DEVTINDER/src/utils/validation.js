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

module.exports = {
    validateSignUpData
}