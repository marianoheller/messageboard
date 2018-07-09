const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.Promise = global.Promise;


var replySchema = new Schema({
  thread_id: { type: Schema.Types.ObjectId, ref: 'Thread', required: true },
  board: { type: String, required: true },
  text: { type: String, required: true },
  
  delete_password: { type: String },
  reported: { type: Boolean, default: false },
  created_on: { type: Date },
});


replySchema.statics.deleteReply = function deleteReply(board, thread_id, _id, passwd ) {
  return new Promise((resolve, reject) => {
    this.find({
      board,
      thread_id,
      _id,
    }, (err, docs) => {
      if(err) return reject(err);
      docs = docs.filter(doc => bcrypt.compareSync(passwd, doc.delete_password));
      if(!docs.length) return reject(Error('No docs found'));
      const targetDoc = docs[0];
      targetDoc.text= '[deleted]';
      targetDoc.save(err => {
        if (err) return reject(err);
        resolve();
      })
    })
  });
}

replySchema.statics.report = function report(board, thread_id, reply_id) {
  return new Promise((resolve, reject) => {
    this.update({
      board,
      thread_id,
      _id: reply_id,
    },
    { $set: { reported: true } },
    (err) => {
      if (err) reject(err);
      resolve();
    });
  });
}

/** ***********************************************************************************************
 * Hooks
 */

replySchema.pre('findOneAndUpdate', function(next) {
  this.update({},{ $set: { bumped_on: new Date() } });
  next();
});

replySchema.pre('save', function(next) {
  this.created_on = new Date();
  next();
});

replySchema.post('findOneAndUpdate', function(doc) {
  console.log('%s reply has been updated', doc._id);
});

replySchema.post('save', function(doc) {
  console.log('%s reply has been saved', doc._id);
});

var Reply = mongoose.model('Reply', replySchema);


module.exports = Reply;