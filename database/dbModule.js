const mongoose = require("mongoose");

// --change connect to process.env.DB for final submission

mongoose
  .connect(process.env.DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .catch(error => {
    console.log("error in connecting to mongodb");
  });

//--create a new schema and model
const schema = mongoose.Schema;

const messageChildSchema = new schema({
  text: { type: String },
  password: { type: String,select:false},
  reported:{type: Boolean,default:false},
  created_on: { type: String }
});

const messageSchema = new schema({
  board: { type: String},
  text: { type: String, required: true },
  password: { type: String, required: true,select:false },
  reported:{type: Boolean, default:false},
  created_on: { type: String },
  bumped_on: { type: String },
  replies: [messageChildSchema]
});

//-- created on automatically
messageSchema.pre("save", function(next) {
  var now = new Date();
  if (!this.created_on) {
    this.created_on = now.toISOString();
  }
if(this.replies.length==0){
  this.bumped_on = this.created_on};  
  next();
});

messageChildSchema.pre("save", function(next) {
  var now = new Date();
  if (!this.created_on) {
    this.created_on = now.toISOString();
  }
  this.ownerDocument().bumped_on = this.created_on;
  next();
});

module.exports = mongoose.model("Board", messageSchema);