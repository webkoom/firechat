function $(layer){
			return document.getElementById(layer)
		}
		var config = {
			apiKey: "AIzaSyAyi0KdBqi7Oow6Yy8EStEQEBBn1sT1c2A",
			authDomain: "firexhat.firebaseapp.com",
			databaseURL: "https://firexhat.firebaseio.com",
			storageBucket: "firexhat.appspot.com",
		}
		firebase.initializeApp(config)		
		var database=firebase.database()
		var	timestamp=firebase.database.ServerValue.TIMESTAMP
		var check
		url2=location.href.split('/')
		url=url2[2].split('.')
		var domain='firexhat/'+url[0]
		function now(time) {
			date=new Date(time)
			month=date.getMonth()+1
			day=date.getDate()
			hour=date.getHours()
			minutes=date.getMinutes()
			seconds=date.getSeconds()
			return date.getFullYear()+'-'+(month<10?'0'+month:month)+'-'+(day<10?'0'+day:day)+' '+(hour<10?'0'+hour:hour)+':'+(minutes<10?'0'+minutes:minutes)+':'+(seconds<10?'0'+seconds:seconds)
		}
		function createRoom(){
			if(!$('room').value){
				alert('The room name must be setted')
			} else {
				Room=database.ref(domain+'/'+$('room').value)
				Room.once('value',function(snap){
					if(!snap.val()){
						Room.set({
							users: '',
							messages: '',
							date: timestamp
						})
					}
					document.cookie='room='+$('room').value
					init()
				}).catch(function(error){
					alert(error)
				})
			}
		}
		function enterRoom(){
			if(!$('nick').value){
				alert('The nickname must be setted')
			} else {
				User=database.ref(domain+'/'+$('room').value+'/users/'+$('nick').value)
				User.once('value',function(snap){
					if(snap.val()){
						alert('The nickname is already used')
					}else{
						User.set(timestamp).then(function(){
							document.cookie='nick='+$('nick').value
							setTimeout(function(){
								$('message').value='Enters the room'
								sendMessage()
							},1500)							
							init()
						}).catch(function(error){
							alert(error)
						})
					}
				}).catch(function(error){
					alert(error)
				})
			}
		}
		function formatMessage(message){
			http=!message.match(/(https?):\/\//)?'http://':''
			return message.replace(/>/g,'&gt;').replace(/</g,'&lt;').replace(/(https?:\/\/(?:www([0-9])\.|(?!www([0-9])))[^\s\.]+\.[^\s]{2,}|www(?:[0-9]|(?![0-9]))\.[^\s]+\.[^\s]{2,})/g, "<a href='"+http+"$1' target='_blank'>$1</a>")
		}
		function loadMessage(date,user,message){
			$('messages').innerHTML='<p class="message"><span class="user">'+user+'</span> <span class="data">'+now(date)+'</span><br><span class="message">'+formatMessage(message)+'</span></p>'+$('messages').innerHTML
			document.title='New message'
		}
		function sendMessage(out){
			if(getCookie('room')&&getCookie('nick')&&$('message').value!=''){
				database.ref(domain+'/'+$('room').value+'/date').set(timestamp)
				database.ref(domain+'/'+$('room').value+'/messages').push({
					date: timestamp,
					user: $('nick').value,
					message: $('message').value
				})
				$('message').value=''
				checkUser(out)
			}
		}
		function changeRoom(){
			$('room').value=''
			document.cookie='room='
			init()
		}
		function checkUser(out){
			database.ref(domain+'/'+$('room').value+'/date').set(timestamp)
			database.ref(domain+'/'+$('room').value+'/date').once('value',function(snap){
				document.cookie="time="+snap.val()
			})
			if(!out)database.ref(domain+'/'+$('room').value+'/users/'+$('nick').value).set(timestamp)
			database.ref(domain+'/'+$('room').value+'/users').once('value', function(snap){
				userList=snap.val()
				for(x in userList){
					if(getCookie('time')-userList[x]>310000){
						database.ref(domain+'/'+$('room').value+'/users/'+x).remove()
					}					
				}
			})
		}
		function leaveRoom(){
			database.ref(domain+'/'+$('room').value+'/users/'+$('nick').value).remove().then(function(){
				$('message').value='Leaves the room'
				sendMessage(1)
				$('nick').value=''
				$('messages').innerHTML=''	
				$('users').innerHTML=''
				document.cookie='nick='
				database.ref(domain+'/'+$('room').value+'/messages').off()
				database.ref(domain+'/'+$('room').value+'/users').off()
				init()
			}).catch(function(error){
				alert(error)
			})
		}
		var state=new Array()
		var field='room,nick,message,go,enter,change,send,leave'.split(',')
		state[0]='text,hidden,hidden,button,hidden,hidden,hidden,hidden'.split(',')
		state[1]='hidden,text,hidden,hidden,button,button,hidden,hidden'.split(',')
		state[2]='hidden,hidden,text,hidden,hidden,hidden,button,button'.split(',')
		function State(action){
			for(i=0;i<field.length;i++)$(field[i]).type=state[action][i]
		}
		function init(){
			if(getCookie('room'))$('room').value=getCookie('room')
			if(getCookie('nick'))$('nick').value=getCookie('nick')
			if(getCookie('room')&&getCookie('nick')){
				State(2)
				check=setInterval(checkUser,300000)
				$('label').innerHTML='<b>Room:</b> '+getCookie('room')
				database.ref(domain+'/'+$('room').value+'/messages').limitToLast(20).on('child_added', function(snap) {
					var newMessage=snap.val()
					loadMessage(newMessage.date,newMessage.user,newMessage.message)
				})
				database.ref(domain+'/'+$('room').value+'/users').on('value', function(snap) {
					users.innerHTML='<b>On-line:</b> '
					for(x in snap.val())users.innerHTML=users.innerHTML+x+', '
					users.innerHTML=users.innerHTML.substring(0,(users.innerHTML.length-2))
				})
			}else if(getCookie('room')&&!getCookie('nick')){
				State(1)
				$('label').innerHTML='<b>Room:</b> '+getCookie('room')
				clearInterval(check)
			}else{
				State(0)
				$('label').innerHTML='Xhat'
			}
		}
		function getCookie(Cookie){
			cookieData=false
			cookies=document.cookie.split('; ')
			for(cok in cookies){
				if(!cookies[cok].indexOf(Cookie+'=')){
					cookieValue=cookies[cok].split('=')
					cookieData=cookieValue[1]
					break
				}
			}
			return cookieData
		}
		function postForm(){
			if(!getCookie('room')){
				createRoom()
			}else if(!getCookie('nick')){
				enterRoom()
			}else{
				sendMessage()
			}
			return false
		}
		function noNotice(){
			document.title=''
		}
		window.onfocus = noNotice
		document.onmousemove = noNotice
