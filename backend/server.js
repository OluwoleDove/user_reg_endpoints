import express from 'express';
import path from 'path';
import config from './config';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import userRoute from './routes/userRoute';
import itemRoute from './routes/itemRoute';
import shipItemRoute from './routes/shipItemRoute';
import uploadRoute from './routes/uploadRoute';
import enquiryRoute from './routes/enquiryRoute';

const mongodbUrl = config.MONGODB_URL;
mongoose.connect(mongodbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true
  /*useFindAndModify: false
  useCreateIndex: true,
  autoIndex: true*/
}).catch(error => console.log(error.reason));


const app = express();
app.use(bodyParser.json());
app.use("/api/uploads", uploadRoute);
app.use("/api/users", userRoute);
app.use("/api/items", itemRoute);
app.use("/api/shipItems", shipItemRoute);
app.use("/api/enquiry", enquiryRoute);
app.get("/api/config/paystack", (req, res) => {
  res.send(config.PAYSTACK_CLIENT_ID);
})

const __dirname = path.resolve();

app.use('/uploads', express.static(path.join(__dirname, '/../uploads')));
app.use(express.static(path.join(__dirname, '/../frontend/build')));
app.get('*', (req, res) => {
  //res.sendFile(path.join(`${__dirname}/../frontend/build/index.html`));
});

app.listen(5000, () => { console.log("Server started at http://localhost:5000") });
