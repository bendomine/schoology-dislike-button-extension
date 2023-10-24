const SERVER_URL =
	'https://script.google.com/macros/s/AKfycby_qNwSwiS-CLLV1gZNXrOrZc2qnX4VeuwmkKrDxOGVB9oUkaZdgGnEYakmjfl4QHFg/exec';
let userId;
let tempId;
let numPosts = 0;

function waitingForPostLoad() {
	let newNumPosts = document.getElementsByClassName('edge-item').length;
	if (newNumPosts == numPosts) {
		setTimeout(waitingForPostLoad, 100);
		return;
	}
	numPosts = newNumPosts;
	updatePage();
}

function waitingForCommentLoad(target) {
	if (document.getElementById(target.id)) {
		setTimeout(() => {
			waitingForCommentLoad(target);
		}, 100);
		return;
	}
	updatePage();
}

function updatePage() {
	modifyPage();

	let query = [];
	let ids = document.getElementsByClassName('like-btn');
	for (let i = 0; i < ids.length; ++i) {
		if (!ids[i].classList.contains('dislike-button'))
			query.push(ids[i].getAttribute('ajax').substring(8));
	}

	let request = new XMLHttpRequest();
	request.open('GET', SERVER_URL + '?mode=get&posts=' + JSON.stringify(query) + '&uid=' + userId);
	request.onload = () => {
		let response = JSON.parse(request.responseText);
		console.log('Schoology dislike extension-- response received: ' + request.responseText);
		if (response.success) {
			updateValues(response.output);
		} else {
			if (response.output.type) errorDialogue(response.output.type, response.output.message);
			else errorDialogue('Error', response.output.message);
		}
	};
	request.send();
}

function modifyPage() {
	let posts = document.getElementsByClassName('edge-item');

	for (let i = 0; i < posts.length; ++i) {
		if (posts[i].getElementsByClassName('s-dislike-sentence').length == 0) {
			posts[i]
				.getElementsByClassName('edge-footer')[0]
				.children[2].insertAdjacentText('afterend', ' · ');
			let newDislikeButton = posts[i]
				.getElementsByClassName('edge-footer')[0]
				.children[3].insertAdjacentElement(
					'beforebegin',
					posts[i].getElementsByClassName('edge-footer')[0].children[2].cloneNode(true)
				);
			newDislikeButton.children[0].textContent = 'Dislike';
			newDislikeButton.classList.add('dislike-button');
			newDislikeButton.children[0].style.color = 'red';
			newDislikeButton.removeAttribute('ajax');
			if (posts[i].getElementsByClassName('s-like-sentence').length > 0) {
				let newDislike = posts[i]
					.getElementsByClassName('s-like-sentence')[0]
					.insertAdjacentElement(
						'afterend',
						posts[i].getElementsByClassName('s-like-sentence')[0].cloneNode(true)
					);
				newDislike.className = 's-dislike-sentence';
				newDislike.classList.add('dislike-counter');
				newDislike.children[0].style.background =
					'url(' +
					chrome.runtime.getURL('images/icons_sprite_feed_modified.png') +
					') no-repeat -1px -76px';
				newDislike.children[1].remove();
				newDislike.lastChild.textContent = '__ people disliked this';
			} else {
				posts[i]
					.getElementsByClassName('feed-comments')[0]
					.classList.remove('s-update-edge-hide-comments-form');
				let newDislike = posts[i]
					.getElementsByClassName('feed-comments-top')[0]
					.insertAdjacentHTML(
						'afterend',
						'<span class="s-dislike-sentence dislike-counter"><span style="background: url(' +
							chrome.runtime.getURL('images/icons_sprite_feed_modified.png') +
							') -1px -76px no-repeat;"></span>__ people disliked this</span>'
					);
			}
		}
	}

	let comments = document.getElementsByClassName('comment-footer');
	for (let i = 0; i < comments.length; ++i) {
		if (comments[i].getElementsByClassName('dislike-button').length == 0) {
			comments[i].insertBefore(document.createTextNode(' · '), comments[i].lastChild);
			let newDislikeButton = comments[i].insertBefore(
				comments[i].children[1].cloneNode(true),
				comments[i].lastChild
			);
			newDislikeButton.removeAttribute('ajax');
			newDislikeButton.classList.add('dislike-button');
			newDislikeButton.textContent = 'Dislike';
			newDislikeButton.style.setProperty('color', 'red', 'important');
			newDislikeButton.onclick = () => {
				console.log('hi!');
				dislike(
					comments[i]
						.getElementsByClassName('like-btn')[0]
						.getAttribute('ajax')
						.substring(8)
				);
			};

			let newDislikeCounter = comments[i].lastElementChild.insertAdjacentHTML(
				'afterend',
				'<span class="infotip sCommonInfotip-processed s-dislike-comment" tipsygravity="s" tabindex="0" original-title=""><a class="like-details-btn schoology-processed sExtlink-processed" style="background: url(' +
					chrome.runtime.getURL('images/icons_sprite_feed_modified.png') +
					') 0px -77px no-repeat;"><span class="s-like-comment-icon dislike-counter">__</span></a><span class="infotip-content">__ people like this</span></span>'
			);
			// newDislikeCounter.getElementsByClassName('s-like-comment-icon')[0].style.color = 'red';
		}
	}

	if (
		!document
			.getElementsByClassName('s-edge-feed-more-link')[0]
			.classList.contains('added-dislike-onclick')
	) {
		document
			.getElementsByClassName('s-edge-feed-more-link')[0]
			.children[0].addEventListener('click', () => {
				waitingForPostLoad();
			});
		document
			.getElementsByClassName('s-edge-feed-more-link')[0]
			.classList.add('added-dislike-onclick');
	}

	let showMoreComments = document.getElementsByClassName('feed-comments-viewall');
	for (let i = 0; i < showMoreComments.length; ++i) {
		if (!showMoreComments[i].classList.contains('added-dislike-onclick')) {
			showMoreComments[i].addEventListener('click', (event) => {
				waitingForCommentLoad(event.target);
			});
			showMoreComments[i].classList.add('added-dislike-onclick');
		}
	}
}

function updateValues(dislikes) {
	let counters = document.getElementsByClassName('dislike-counter');
	let id;
	for (let i = 0; i < counters.length; ++i) {
		if (counters[i].classList.contains('s-dislike-sentence'))
			id = counters[i].parentElement.parentElement
				.getElementsByClassName('like-btn')[0]
				.getAttribute('ajax')
				.substring(8);
		else
			id = counters[i].parentElement.parentElement.parentElement
				.getElementsByClassName('like-btn')[0]
				.getAttribute('ajax')
				.substring(8);
		for (let j = 0; j < dislikes.length; ++j) {
			if (dislikes[j].postId == id) {
				if (counters[i].classList.contains('s-dislike-sentence')) {
					if (dislikes[j].dislikedByUser) {
						counters[i].parentElement.parentElement.getElementsByClassName(
							'dislike-button'
						)[0].onclick = () => {
							undislike(
								counters[i].parentElement.parentElement
									.getElementsByClassName('like-btn')[0]
									.getAttribute('ajax')
									.substring(8)
							);
						};
						counters[i].parentElement.parentElement.getElementsByClassName(
							'dislike-button'
						)[0].children[0].textContent = 'Undislike';
					} else {
						counters[i].parentElement.parentElement.getElementsByClassName(
							'dislike-button'
						)[0].onclick = () => {
							dislike(
								counters[i].parentElement.parentElement
									.getElementsByClassName('like-btn')[0]
									.getAttribute('ajax')
									.substring(8)
							);
						};
						counters[i].parentElement.parentElement.getElementsByClassName(
							'dislike-button'
						)[0].children[0].textContent = 'Dislike';
					}

					if (dislikes[j].dislikes > 0) {
						counters[i].style.display = 'block';
						if (dislikes[j].dislikes == 1 && dislikes[j].dislikedByUser)
							counters[i].lastChild.textContent = 'You dislike this';
						else if (dislikes[j].dislikes == 1 && !dislikes[j].dislikedByUser)
							counters[i].lastChild.textContent = '1 person dislikes this';
						else if (dislikes[j].dislikes == 2 && dislikes[j].dislikedByUser)
							counters[i].lastChild.textContent = 'Disliked by you and 1 person';
						else if (dislikes[j].dislikes > 2 && dislikes[j].dislikedByUser)
							counters[i].lastChild.textContent =
								'Disliked by you and ' + (dislikes[j].dislikes - 1) + ' people';
						else
							counters[i].lastChild.textContent =
								dislikes[j].dislikes + ' people disliked this';
					} else counters[i].style.display = 'none';
				} else {
					if (dislikes[j].dislikedByUser) {
						counters[
							i
						].parentElement.parentElement.parentElement.getElementsByClassName(
							'dislike-button'
						)[0].onclick = () => {
							undislike(
								counters[i].parentElement.parentElement.parentElement
									.getElementsByClassName('like-btn')[0]
									.getAttribute('ajax')
									.substring(8)
							);
						};
						counters[
							i
						].parentElement.parentElement.parentElement.getElementsByClassName(
							'dislike-button'
						)[0].textContent = 'Undislike';
					} else {
						counters[
							i
						].parentElement.parentElement.parentElement.getElementsByClassName(
							'dislike-button'
						)[0].onclick = () => {
							dislike(
								counters[i].parentElement.parentElement.parentElement
									.getElementsByClassName('like-btn')[0]
									.getAttribute('ajax')
									.substring(8)
							);
						};
						counters[
							i
						].parentElement.parentElement.parentElement.getElementsByClassName(
							'dislike-button'
						)[0].textContent = 'Dislike';
					}

					if (dislikes[j].dislikes > 0) {
						counters[i].lastChild.textContent = dislikes[j].dislikes;
						counters[i].parentElement.parentElement.style.display = 'inline';
					} else counters[i].parentElement.parentElement.style.display = 'none';
				}
				// let textToSet;
				// if (dislikes[j].dislikedByUser) textToSet = 'Undislike';
				// else textToSet = 'Dislike';
				// if (counters[i].classList.contains('s-dislike-sentence')) {
				// 	counters[i].parentElement.parentElement.getElementsByClassName(
				// 		'dislike-button'
				// 	)[0].children[0].textContent = textToSet;
				// } else {
				// 	counters[i].parentElement.parentElement.parentElement.getElementsByClassName(
				// 		'dislike-button'
				// 	)[0].textContent = textToSet;
				// }
				break;
			}
		}
	}
}

function dislike(postId) {
	let request = new XMLHttpRequest();
	request.open('GET', SERVER_URL + '?mode=add&post=' + postId + '&uid=' + userId);
	request.onload = () => {
		let response = JSON.parse(request.responseText);
		console.log('Schoology dislike extension-- response received: ' + request.responseText);
		if (response.success) {
			updatePage();
		} else {
			if (response.output.type) errorDialogue(response.output.type, response.output.message);
			else errorDialogue('Error', response.output.message);
		}
	};
	request.send();
}

function undislike(postId) {
	let request = new XMLHttpRequest();
	request.open('GET', SERVER_URL + '?mode=remove&post=' + postId + '&uid=' + userId);
	request.onload = () => {
		let response = JSON.parse(request.responseText);
		console.log('Schoology dislike extension-- response received: ' + request.responseText);
		if (response.success) {
			updatePage();
		} else {
			if (response.output.type) errorDialogue(response.output.type, response.output.message);
			else errorDialogue('Error', response.output.message);
		}
	};
	request.send();
}

// function createNewUser() {
// 	let email = prompt('Kehillah email address:');
// 	let request = new XMLHttpRequest();
// 	let uid = generateUid();
// 	request.open('GET', SERVER_URL + '?mode=sendEmail&email=' + email + '&uid=' + uid);
// 	request.onload = () => {
// 		let response = JSON.parse(request.responseText);
// 		console.log('Schoology dislike extension-- response received: ' + request.responseText);
// 		if (response.success) {
// 			verifyUser(email, uid);
// 		} else {
// 			if (response.output.type) errorDialogue(response.output.type, response.output.message);
// 			else errorDialogue('Error', response.output.message);
// 		}
// 	};
// 	request.send();
// }

// function verifyUser(email, uid) {
// 	let code = prompt(
// 		'Verification email sent. Please check your email (' + email + ') for the code.'
// 	);
// 	let request = new XMLHttpRequest();
// 	request.open('GET', SERVER_URL + '?mode=verifyUser&code=' + code + '&uid=' + uid);
// 	request.onload = () => {
// 		let response = JSON.parse(request.responseText);
// 		console.log('Schoology dislike extension-- response received: ' + request.responseText);
// 		if (response.success) {
// 			chrome.storage.sync.set({ uid: uid }).then(() => {
// 				alert('User creation successful. ID is ' + uid);
// 				userId = uid;
// 				waitingForPostLoad();
// 			});
// 		} else {
// 			if (response.output.type) errorDialogue(response.output.type, response.output.message);
// 			else errorDialogue('Error', response.output.message);
// 		}
// 	};
// 	request.send();
// }

function generateUid() {
	let chars = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	return 'xxxxxxxxxxxxxxxxxxxx'.replace(/x/g, () => {
		return chars[Math.floor(Math.random() * chars.length)];
	});
}

function userCreationDialogue() {
	let uid = generateUid();

	let dislikeCover = document.createElement('div');
	dislikeCover.classList.add('dislike-cover');
	document.body.appendChild(dislikeCover);

	let dislikeDialogue = document.createElement('div');
	dislikeDialogue.classList.add('dislike-dialogue');
	dislikeCover.appendChild(dislikeDialogue);

	let h1 = document.createElement('h1');
	h1.innerText = 'Schoology dislike extension';
	dislikeDialogue.appendChild(h1);

	let h3 = document.createElement('h3');
	h3.innerText = 'Thanks for using the extension! To continue, please verify your email address.';
	dislikeDialogue.appendChild(h3);

	let emailLabel = document.createElement('label');
	emailLabel.for = 'emailInput';
	emailLabel.textContent = 'Kehillah email:';
	dislikeDialogue.appendChild(emailLabel);

	let emailInput = document.createElement('input');
	emailInput.type = 'text';
	emailInput.name = 'emailInput';
	dislikeDialogue.appendChild(emailInput);

	dislikeDialogue.appendChild(document.createElement('br'));

	let codeLabel = document.createElement('label');
	codeLabel.for = 'codeInput';
	codeLabel.textContent = 'Verification code:';
	codeLabel.style.display = 'none';
	dislikeDialogue.appendChild(codeLabel);

	let codeInput = document.createElement('input');
	codeInput.type = 'text';
	codeInput.name = 'codeInput';
	codeInput.style.display = 'none';
	dislikeDialogue.appendChild(codeInput);

	let continueButton = document.createElement('button');
	continueButton.innerText = 'Continue';
	continueButton.onclick = (event) => {
		event.target.disabled = true;
		event.target.parentElement
			.getElementsByClassName('loading-hide')[0]
			.classList.add('loading-show');
		event.target.parentElement
			.getElementsByClassName('loading-show')[0]
			.classList.remove('loading-hide');
		if (!event.target.parentElement.children[3].disabled) {
			event.target.parentElement.children[3].disabled = true;
			let email = event.target.parentElement.children[3].value;
			let request = new XMLHttpRequest();
			request.open('GET', SERVER_URL + '?mode=sendEmail&email=' + email + '&uid=' + uid);
			request.onload = () => {
				event.target.disabled = false;
				let response = JSON.parse(request.responseText);
				console.log(
					'Schoology dislike extension-- response received: ' + request.responseText
				);
				event.target.parentElement
					.getElementsByClassName('loading-show')[0]
					.classList.add('loading-hide');
				event.target.parentElement
					.getElementsByClassName('loading-hide')[0]
					.classList.remove('loading-show');
				if (response.success) {
					event.target.parentElement.children[5].style.display = 'inline';
					event.target.parentElement.children[6].style.display = 'inline';
				} else {
					event.target.parentElement.children[3].disabled = false;
					if (response.output.type)
						errorDialogue(response.output.type, response.output.message);
					else errorDialogue('Error', response.output.message);
				}
			};
			request.send();
		} else {
			event.target.parentElement.children[6].disabled = true;
			let code = event.target.parentElement.children[6].value;
			let request = new XMLHttpRequest();
			request.open('GET', SERVER_URL + '?mode=verifyUser&code=' + code + '&uid=' + uid);
			request.onload = () => {
				event.target.parentElement
					.getElementsByClassName('loading-show')[0]
					.classList.add('loading-hide');
				event.target.parentElement
					.getElementsByClassName('loading-hide')[0]
					.classList.remove('loading-show');
				let response = JSON.parse(request.responseText);
				console.log(
					'Schoology dislike extension-- response received: ' + request.responseText
				);
				if (response.success) {
					chrome.storage.sync.set({ uid: uid }).then(() => {
						document.getElementsByClassName('dislike-cover')[0].style.display = 'none';
						errorDialogue('User creation successful', "You're all set up!");
						userId = uid;
						waitingForPostLoad();
					});
				} else {
					event.target.parentElement.children[6].disabled = false;
					event.target.disabled = false;
					if (response.output.type)
						errorDialogue(response.output.type, response.output.message);
					else errorDialogue('Error', response.output.message);
				}
			};
			request.send();
		}
	};
	dislikeDialogue.appendChild(continueButton);

	let closeButton = document.createElement('p');
	closeButton.innerText = '×';
	closeButton.onclick = closeDialogue;
	dislikeDialogue.appendChild(closeButton);

	let loading = document.createElement('div');
	loading.classList.add('loading-hide');
	dislikeDialogue.appendChild(loading);
}

function closeDialogue() {
	document.getElementsByClassName('dislike-cover')[0].style.display = 'none';
}

function errorDialogue(heading, message) {
	let errorCover = document.createElement('div');
	errorCover.classList.add('error-cover');
	document.body.appendChild(errorCover);

	let errorDialogue = document.createElement('div');
	errorDialogue.classList.add('error-dialogue');
	errorCover.appendChild(errorDialogue);

	let h1 = document.createElement('h1');
	h1.innerText = heading;
	errorDialogue.appendChild(h1);

	let h3 = document.createElement('h3');
	h3.innerText = message;
	errorDialogue.appendChild(h3);

	let closeButton = document.createElement('p');
	closeButton.innerText = '×';
	closeButton.onclick = (event) => {
		closeError(event.target.parentElement.parentElement);
	};
	errorDialogue.appendChild(closeButton);
}

function closeError(target) {
	target.remove();
}

chrome.storage.sync.clear();
chrome.storage.sync.get(['uid']).then((result) => {
	userId = result.uid;
	if (userId) waitingForPostLoad();
	else {
		userCreationDialogue();
	}
});
