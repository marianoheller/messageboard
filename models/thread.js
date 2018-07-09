const bcrypt = require('bcryptjs');
const isBefore = require('date-fns/is_before');
const mongoose = require('mongoose');
const Reply = require('./reply');
const Schema = mongoose.Schema;

mongoose.Promise = global.Promise;
const saltRounds = 10;


var threadSchema = new Schema({
  board: { type: String, required: true },
  text: { type: String, required: true },

  created_on: { type: Date },
  bumped_on: { type: Date },
  reported: { type: Boolean, default: false },
  delete_password: { type: String, required: true },
  replies: [{ type: Schema.Types.ObjectId, ref: 'Reply' }],
});


/** *************************************************************************
 * Static methods
 */

threadSchema.statics.post = function post( board, postOpts ) {
  return new Promise((resolve, reject) => {
    const encryptedPasswd = bcrypt.hashSync(postOpts.delete_password, saltRounds);
    const post = new Thread({
      board,
      text: postOpts.text,
      delete_password: encryptedPasswd,
    });
    post.save(err => {
      if (err) reject(err);
      resolve(post);
    });
  });
}

threadSchema.statics.reply = function reply(board, body ) {
  return new Promise((resolve, reject) => {
    this.findOne({ board, _id: body.thread_id}, (err, thread) => {
      if (err) return reject(err);
      if (!thread) return reject(Error(`No thread found with id: ${body.thread_id}`));
      const reply = new Reply({
        board: board,
        thread_id: thread._id,
        text: body.text,
        delete_password: bcrypt.hashSync(body.delete_password, saltRounds),
      });
      reply.save(err => {
        if (err) reject(err);
        thread.replies.push(reply._id);
        thread.save(err => {
          if (err) return reject(err);
          resolve(reply);
        })
      });
    });
  });
}


threadSchema.statics.getRecentThreads = function getRecentThreads(board) {
  const filteredKeys = ['reported', 'delete_password'];
  return new Promise((resolve, reject) => {
    this.find({ board })
    .populate('replies')
    .exec((err, docs) => {
      if (err) reject(err);
      // Sort latest
      docs.sort( (a, b) => isBefore(a, b) ? -1 : 1);
      resolve(docs.slice(0, saltRounds).map(d => {
        let { replies } = d;
        if (replies) replies = d.replies.slice(0,3);
        replies = replies.map(r => {
          filteredKeys.forEach(k => r[k] = undefined);
          return r;
        });
        d.replies = replies;
        return d;
      }));
    });
  });
}

threadSchema.statics.getFullThread = function getFullThread(board, thread_id) {
  const filteredKeys = ['reported', 'delete_password'];
  return new Promise((resolve, reject) => {
    this.findOne({ board, _id: thread_id })
    .populate('replies')
    .exec((err, thread) => {
      if (err) reject(err);
      if (!thread) reject(Error('Thread not found'));
      thread.replies = thread.replies.map(r => {
        filteredKeys.forEach(k => r[k] = undefined);
        return r;
      });
      resolve(thread);
    });
  });
}

threadSchema.statics.deleteThread = function deleteThread(board, body) {
  return new Promise((resolve, reject) => {
    this.find({
      board,
      _id: body.thread_id,
    }, (err, docs) => {
      if (err) return reject(err);
      if (!docs) return reject(Error('Doc not found'));
      docs = docs.filter(doc => bcrypt.compareSync(body.delete_password, doc.delete_password));
      if(!docs.length) return reject(Error('Doc not found'));
      docs.forEach(doc => doc.remove());
      resolve();
    });
  });
}

threadSchema.statics.report = function report(board, thread_id) {
  return new Promise((resolve, reject) => {
    this.update({
      board,
      _id: thread_id,
    },
    { $set: { reported: true } },
    (err) => {
      if (err) reject(err);
      resolve();
    });
  });
}

/** *****************************************************************************
 * HOOKS
 */

threadSchema.pre('findOneAndUpdate', function(next) {
  this.update({},{ $set: { bumped_on: new Date() } });
  next();
});

threadSchema.pre('save', function(next) {
  const now = new Date();
  this.created_on = now;
  this.bumped_on = now;
  next();
});

// bcrypt.compareSync('somePassword', hash)
threadSchema.post('findOneAndUpdate', function(doc) {
  console.log('%s has been updated', doc._id);
});

threadSchema.post('save', function(doc) {
  console.log('%s has been saved', doc._id);
});




var Thread = mongoose.model('Thread', threadSchema);
module.exports = Thread;