import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
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
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: false
    },
    coordinates: {
      type: [Number],
      required: false
    }
  },
  isSharingLocation: { type: Boolean, default: false },
  lastKnownLocation: { lat: Number, lng: Number },
  city: {
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
  password: {
    type: String,
    required: true,
    minlength: 6,
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
}, { timestamps: true });


userSchema.index({ location: "2dsphere" });

userSchema.pre("save", function (next) {
  if (this.username === "") this.username = undefined;
  if (this.primaryPhone === "") this.primaryPhone = undefined;
  if (this.lastTransactionId === "") this.lastTransactionId = undefined;
  next();
});

userSchema.pre(["updateOne", "findOneAndReplace", "findOneAndUpdate"], function (next) {
  const update = this.getUpdate();
  if (update) {
    if (update.username === "") update.username = undefined;
    if (update.primaryPhone === "") update.primaryPhone = undefined;
    if (update.lastTransactionId === "") update.lastTransactionId = undefined;
    
    if (update.$set) {
      if (update.$set.username === "") update.$set.username = undefined;
      if (update.$set.primaryPhone === "") update.$set.primaryPhone = undefined;
      if (update.$set.lastTransactionId === "") update.$set.lastTransactionId = undefined;
    }
  }
  next();
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;