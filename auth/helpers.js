const db = require('../data/dbConfig.js');

module.exports = {
  addUser,
  findUsers,
  findUserByEmail,
  findUserById,
  updateUser,
  getUserHobbies,
  findHobbyByName,
  findHobbyById,
  addUserHobby,
  addHobbyToUser,
  removeUser,
  removeHobbyFromUser,
  Decline,
  Request,
  sendMessage,
  getMessages,
  getSwipeableUsers,
  checkAddFriendship,
  deleteFriendship,
  deleteSwipes,
  getFriends,
  getRequests
};

function findUsers() {
  return db('users').select('*');
}

function findUserByEmail(email) {
  return db('users').where('email', email).first();
}

async function addUser(user) {
  const [ new_id ] = await db('users').insert(user);
  return findUserById(new_id);
}

function findUserById(user_id) {
  return db('users')
    .where({ user_id })
    .first();
}

function getUserHobbies(id) {
  return db('hobbies as h')
  .join('user_hobbies as uhob', 'uhob.hobby_id', 'h.hobby_id')
  .join('users as u', 'u.user_id', 'uhob.user_id')
  .select('h.name as UserHobbies')
  .where('u.user_id', id);
}

function findHobbyByName(name) {
  return db('hobbies').where({ name }).first();
}

function findHobbyById(hobby_id) {
  return db('hobbies')
  .where({ hobby_id })
  .first();
}

function addUserHobby(user_id, hobby_id) {
  const userHobby = {
    user_id: user_id,
    hobby_id: hobby_id
  }
  return db('user_hobbies').insert(userHobby);
}

async function addHobbyToUser(user_id, hobby) {
  const [hobby_id] = await db('hobbies').insert(hobby);

  addUserHobby(user_id, hobby_id);
}

async function updateUser(user_id, changes) {
  const newInfo = {...changes};
  const userInfo = await findUserById(user_id);
  const updatedInfo = {
    ...userInfo,
    ...newInfo
  }
  
  return db('users')
    .where({user_id})
    .update(updatedInfo);
}

function removeUser(user_id) {
  return db('users')
    .where({ user_id })
    .del();
}

function removeHobbyFromUser(user_id, hobby_id) {
  return db('user_hobbies')
  .where({ user_id, hobby_id })
  .del();
}

function Decline(swiper_id, swiped_id) {
  const newSwipe = {
    swiper_id: swiper_id,
    swiped_id: swiped_id,
    requested: 0,
    declined: 1
  }
  return db('swipes').insert(newSwipe);
}

function Request(swiper_id, swiped_id) {
  const newSwipe = {
    swiper_id: swiper_id,
    swiped_id: swiped_id,
    requested: 1,
    declined: 0
  }
  return db('swipes').insert(newSwipe);
}

function sendMessage(from_id, to_id, message) {
  const newMessage = {
    from_id: from_id,
    to_id: to_id,
    message: message
  }
  return db('messages').insert(newMessage);
}

function getMessages(user_id, friend_id) {
  return db('messages')
  .where(function(){
    this.where('from_id', user_id).orWhere('from_id', friend_id)
  })
  .andWhere(function(){
    this.where('to_id', user_id).orWhere('to_id', friend_id)
  })
  .select('message')
  .orderBy('message_id');
}

function getSwipeableUsers(user_id) {
  const subquery = db('swipes').where('swiper_id', user_id).select('swiped_id')
  return db('users')
  .whereNotIn('user_id', subquery)
  .andWhere('user_id', '!=', user_id)
  .select('user_id as friend_id', 'name', 'dob', 'gender', 'coordinates', 'location', 'profile_img', 'bio')
  .orderBy('user_id');
}

async function checkAddFriendship(swiper_id, swiped_id) {
  const [ response ] = await db('swipes')
  .where('swiper_id', swiped_id)
  .andWhere('swiped_id', swiper_id)
  .select('requested', 'declined');
  if (response) {
    if (response.requested ===1){
    return db('friends')
    .insert({ user_id: swiper_id, friend_id: swiped_id });
    } else {
      return JSON.stringify({message: "Request swipe added."})
    }
  } else {
    return JSON.stringify({message: "Request swipe added."})
  }
}

function deleteFriendship(user_id, friend_id) {
  return db('friends')
  .where(function(){
    this.where('user_id', user_id).orWhere('user_id', friend_id)
  })
  .andWhere(function(){
    this.where('friend_id', user_id).orWhere('friend_id', friend_id)
  })
  .del();
}

function deleteSwipes(user_id, friend_id) {
  return db('swipes')
  .where('swiper_id', user_id)
  .andWhere('swiped_id', friend_id)
  .del();
}

function getFriends(user_id) {
  return db.distinct('u.user_id', 'u.name', 'u.dob', 'u.gender', 'u.coordinates', 'u.location', 'u.profile_img', 'u.bio')
  .from('users as u')
  .crossJoin('friends as f', function(){
    this.on('f.user_id', '=', 'u.user_id').orOn('f.friend_id', '=', 'u.user_id')
  })
  .where('u.user_id', '!=', user_id)
  .where(function(){
    this.where('f.user_id', user_id).orWhere('f.friend_id', user_id)
  });
}

function getRequests(user_id) {
  const subquery = db('swipes').where('swiped_id', user_id).andWhere('requested', 1).distinct('swiper_id')
  return db('users')
  .whereIn('user_id', subquery)
  .select('user_id as friend_id', 'name', 'dob', 'gender', 'coordinates', 'location', 'profile_img', 'bio')
  .orderBy('user_id');
}