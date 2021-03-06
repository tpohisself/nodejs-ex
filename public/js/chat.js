var $username = 'guest'
,socket = io.connect()
,$chat = $('#chat')
,$users = []
,x = 0
,loggedin = false;

$(function(){
  $('#logout').hide();
  socket.on('new message',function(data){
    if(data.msg && data.msg != null && data.msg != ''){
      var post = '<div class="post" id="'+data._id+'"><div class="row"><div class="cell"><span class="user">'+data.username+'</span></div><div class="cell large"><span class="ts">'+data.date+'</span><br><span class="msg">'+data.msg+'</span></div>';
      if(data.username == $username) post += '<div class="cell controls"><button class="deletePost" value="'+data._id+'"> X </button></div>';
      else if(data.role == 'admin') post += '<div class="cell controls"><button class="masterDeletePost" value="'+data._id+'"> X </button></div>';
      post += '</div></div>';
      $chat.append(post);
      $chat.scrollTop($chat.height() + 100000);
      init();
    }
  });

  socket.on('new login',function(data){
    $('#users').html('');
    for(var i=0;i<data.length;i++){
      $('#users').append('<li>'+data[i]+'</li>');
    }
    if($username != 'guest' && loggedin && data.indexOf($username) < 0){
      $username = 'guest';
      loggedin = false;
      $('#user').html($username);
      init();
    }else if($username != 'guest' && $username != $('#user').html() && data.indexOf($username) >-1){
      $('#user').html($username);
      loggedin = true;
      $('#logout').show();
      init();
    }
  });

  socket.on('delete post',function(id){
    console.log(id +' deleted!');
    $('#'+id).hide();
  });

  if($('#user').html() != 'guest'){
    $username = $('#user').html();
    socket.emit('send login', $username);
  }

  if($username == 'guest'){
    $('#msgForm').hide();
  }else{
    $('#loginForm').hide();
  }
  // console.log($('#user').html());
  init();
  login();
});

function init(){

  if(!loggedin && $username != 'guest'){
    $('#loginForm').hide();
    $('#msgForm').show();
    socket.emit('send login', $username);
    loggedin = true;
    $('#logout').show();
  }

  $chat.scrollTop($chat.height() + 100000);
  $('#msgForm').submit(function(e){
    e.preventDefault();
    if(x==0) x=1;
    console.log('submitted');
    socket.emit('send message', $username, $('#msg').val());
    $('#msg').val('');
  });

  $('.deletePost').click(function(e){
    e.preventDefault();
    var $this = $(this);
    var values = {'user':$username,'id':$this.val()};
    $.ajax({
      url:'/deletePost',
      data:values,
      type:'POST'
    }).done(function(data){
      socket.emit('send delete', data.msg);
    });
  });

  $('.masterDeletePost').click(function(e){
    e.preventDefault();
    var $this = $(this);
    var values = {'user':$username,'id':$this.val()};
    $.ajax({
      url:'/masterDeletePost',
      data:values,
      type:'POST'
    }).done(function(data){
      socket.emit('send delete', data.msg);
    });
  });

}

function login(){
  $('#signup').click(function(e){
    e.preventDefault();
    $('.registration').show();
    $('.login').hide();
  });

  $('#regCancel').click(function(e){
    e.preventDefault();
    $('.registration').hide();
    $('.login').show();
  });
  $('#loginForm').submit(function(e){
    e.preventDefault();
    if(x==0) x=1;
    var data = {
      username: $('#username').val(),
      password:$('#pwd').val()
    };
    hijack(data,'/account/login')
  });
  $('#registerForm').submit(function(e){
    e.preventDefault();
    if(x==0) x=1;
    if($('#regPwd').val() == $('#repwd').val()){
      var data = {
        username: $('#regUsername').val(),
        password:$('#regPwd').val(),
        repwd:$('#repwd').val(),
        email:$('#regEmail').val()
      };
      hijack(data,'/account/register');
    }else{
      alert("Passwords don't match, please try again");
    }
  });
  function hijack(data,url){
    if(x==1){
      x=2;
      $.ajax({
        url:url,
        data:data,
        type:'POST'
      }).done(function(data){
        x=0;
        if(data.msg == 1){
          $('.registration').hide();
          $('.login').show();
          $('#logMsg').html(' - User created, ready to login.');
        }else if(data.msg == 2){
          $username = data.username;
          $('span#user').html(data.username);
          $('.base-form').html('<form id="msgForm" class="pure-form"><textarea class="form-control" id="msg" placeholder="Message"></textarea><br/><br/><input type="submit" class="pure-button pure-button-primary" value="Send Message"/></form>');
          socket.emit('send login', $username);
          init();
        }else{
          $('#regMsg').html(' - '+data.msg);
        }
      });
    }
  }
}
