const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10; 

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true},
    password:{type: String, required: true, minlength: 5, maxlength: 40}
});

//Salt and Hash Passwords
UserSchema.pre('save', function(next){
    //Check if document is new or a new password has been set
    if(this.isNew|| this.isModified('password')) {
        const document = this;
        bcrypt.hash(document.password, saltRounds, function(err, hashedPassword){
            if(err) {
                next(err);
            }else {
                document.password = hashedPassword;
                next();
            }
        });
    } else {
        next();
    }
});

UserSchema.methods.isCorrectPassword = function(password, callback) {
    bcrypt.compare(password, this.password, function(err,same) {
        if (err) {
            callback(err);
        } else {
            callback(err, same);
        }
    })
}

module.exports = mongoose.model('User', UserSchema);