import mongoose from "mongoose";      


if (mongoose.models.User) {
    delete mongoose.models.User;
}

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        trim: true
    },
    email:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
    },
    city:{
        type: String,
        required: false,
        trim: true
    },
    address: {
        type: new mongoose.Schema({
            street: { type: String, required: false }
        }, { _id: false }),
        required: false,
        default: () => ({})
    },
    password:{
        type: String,
        required: true,
        minlength:6,
    },
  forgotPasswordToken: String,
  forgotPasswordTokenExpiry: Date,
    role: {
    type: String,
    default: "user"
  },
},{timestamps:true})


const User = mongoose.model("User", userSchema);

export default User;