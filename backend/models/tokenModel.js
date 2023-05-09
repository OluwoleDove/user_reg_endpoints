import mongoose from 'mongoose';
const _Schema_ = mongoose.Schema;

const tokenSchema = new _Schema_({
    user_id: {
        type: _Schema_.Types.ObjectId,
        required: true,
        ref: 'user'
    },
    token: { type: String, required: true },
    tokenTIme: { 
        type: Date, default: Date.now,
        expires: 1800 // 30 minutes
    }
  });

const tokenModel = mongoose.model('Usercode', tokenSchema);

export default tokenModel;