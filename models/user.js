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
    username: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
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
    isPremium: { type: Boolean, default: false },
    subscriptionPlan: {
         type: String,
         default: "free"
    },
    premiumUntil: { type: Date, default: null },
    phoneNumber: { type: String, sparse: true },
    primaryPhone: { type: String, unique: true, sparse: true },
    lastTransactionId: { type: String, unique: true, sparse: true },
    twitter: {
        type: String,
        trim: true,
        default: ""
    },
    Instagram: {
        type: String,
        trim: true,
        default: ""
    }
},{timestamps:true});

userSchema.pre("findOneAndDelete", async function (next) {
    try {
        const query = this.getQuery();
        const user = await this.model.findOne(query);

        if (user) {
            const userId = user._id;

            if (mongoose.models.Post) {
                await mongoose.models.Post.deleteMany({ userId: userId });
            }

            if (mongoose.models.Comment) {
                await mongoose.models.Comment.deleteMany({ user: userId });
            }
        }
        next();
    } catch (error) {
        next(error);
    }
});

const User = mongoose.model("User", userSchema);

export default User;