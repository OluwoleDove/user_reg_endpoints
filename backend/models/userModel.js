import mongoose from 'mongoose';
const _Schema_ = mongoose.Schema;

const userSchema = new _Schema_({
    username:{ type: String, required: true },
    firstname: { type: String, required: false },
    lastname: { type: String, required: false },
    email: { type: String, required: true, unique: true, dropDups: true },
    phone_number: { type: String, required: false },
    img_dir: { type: String, required: false },
    password: { type: String, required: true },
    newpassword: { type: String, required: false },
    country: { type: String, required: true },
    ipAddress: { type: String, required: true },
    isVerified: { type: Boolean, required: true, default: false },
    isBusiness: { type: Boolean, required: true, default: false },
    buinessName: { type: String, required: false },
    address: { type: String, required: false },
    zipcode: {type: String, required: false },
    isAdmin: { type: Boolean, required: true, default: false }
},
{
    timestamps: true,
}
);

const userModel = mongoose.model('User', userSchema);

export default userModel;