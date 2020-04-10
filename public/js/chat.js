var socket = io();
socket.on('connect', function(){
  console.log('conneted to server');
});
socket.on('disconnect', function(){
  console.log('disconneced from server');
});

socket.on('newMessage', function(message){
  let m1 = $('<div><li class = "text-message"><span style="display: block; font-weight:700; font-size: 14px; word-break:break-word">{{text}}</span>  <span style="display: block; font-size: 10px; text-align: right; padding-top: 4px">{{createdAt}}</span> </li></div>');
  let template = m1.html();
  let html = Mustache.render(template, {
    text: message.text,
    createdAt: moment(message.createdAt).format('h:mm a')
  });
  $('#message-list').append(html);
  scrollToBottom();
});


$('.input-box').on('keydown', (e)=>{
  if(e.which==13){
    writeMessage();
  }
});

$('form').on('submit', function(e){
  e.preventDefault();
  writeMessage();
});

function scrollToBottom () {
  // Selectors
  var messages = jQuery('#message-list');
  var conversation = jQuery('#conversation');
  var newMessage = messages.children('li:last-child')
  // Heights
  var clientHeight = conversation.prop('clientHeight');
  var scrollTop = conversation.prop('scrollTop');
  var scrollHeight = messages.prop('scrollHeight');
  var newMessageHeight = newMessage.innerHeight();
  var lastMessageHeight = newMessage.prev().innerHeight();

  if (clientHeight + scrollTop + newMessageHeight + lastMessageHeight >= scrollHeight) {
    conversation.scrollTop(scrollHeight);
  }
}

function writeMessage(){
  let message_value = $('textarea').val().trim();
  if(message_value=='')
  return ;
  socket.emit('createMessage', {
    from: 'User',
    text: message_value
  }, function(data){
    $('textarea').val('');
    let m2 = $('<div><li class = "text-message message-self"><span style="display: block; font-weight:700; font-size: 14px; word-break: break-word">{{text}}</span><span style="display: block; font-size: 10px; text-align: right; padding-top: 4px">{{createdAt}}</span></li></div>');
    let template = m2.html();
    let html = Mustache.render(template, {
      text: message_value,
      createdAt: moment(data.createdAt).format('h:mm a')
    });
    $('#message-list').append(html);
    scrollToBottom();
  });
}
