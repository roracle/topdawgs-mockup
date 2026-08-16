/* ============================================================
   TOPDAWGS — SOCIAL LAYER
   Everything that makes this behave like a social app: the follow
   graph, likes, threaded comments, saves, hashtags, mentions,
   search, and the notifications those actions generate.
   Pure data operations — no DOM in this file.
   ============================================================ */

/* ---------- Identity helpers ---------- */
function userById(id) {
  if (!id || id === 'me') return STATE.user;
  return MOCK_USERS.find(u => u.id === id) || null;
}
function handleOf(id) { const u = userById(id); return u ? u.handle : 'unknown'; }
function isMe(id) { return id === 'me'; }

/* ---------- Follow graph ---------- */
function isFollowing(userId) {
  return (STATE.user.following || []).indexOf(userId) >= 0;
}
function toggleFollow(userId) {
  const list = STATE.user.following = STATE.user.following || [];
  const i = list.indexOf(userId);
  const u = userById(userId);
  if (i >= 0) { list.splice(i, 1); u.followers = Math.max(0, u.followers - 1); }
  else { list.push(userId); u.followers += 1; }
  saveState();
  return i < 0;
}
function followerCount(userId) {
  const u = userById(userId);
  return isMe(userId) ? STATE.user.followers : u.followers;
}
function followingCount(userId) {
  // Only the signed-in account has a real following list in this prototype.
  return isMe(userId) ? (STATE.user.following || []).length : Math.round(followerCount(userId) * 0.6);
}

/* ---------- Mute / block / pause predicates ---------- */
function isBlocked(userId) {
  const u = userById(userId);
  return u ? (STATE.user.blockedUsers || []).indexOf(u.handle) >= 0 : false;
}
function isPaused(userId) {
  const u = userById(userId);
  return u ? (STATE.user.pausedUsers || []).some(p => p.handle === u.handle) : false;
}
function isMuted(userId) {
  const u = userById(userId);
  return u ? (STATE.user.mutedUsers || []).indexOf(u.handle) >= 0 : false;
}
function toggleMute(userId) {
  const u = userById(userId);
  const list = STATE.user.mutedUsers = STATE.user.mutedUsers || [];
  const i = list.indexOf(u.handle);
  if (i >= 0) list.splice(i, 1); else list.push(u.handle);
  saveState();
  return i < 0;
}
/* Content from blocked, paused, or muted members never reaches the feed. */
function isHidden(userId) {
  return isBlocked(userId) || isPaused(userId) || isMuted(userId);
}

/* ---------- Posts ---------- */
function visiblePosts() {
  let posts = MOCK_POSTS.filter(p => !isHidden(p.authorId));
  if (STATE.feedMode === 'following') {
    posts = posts.filter(p => isMe(p.authorId) || isFollowing(p.authorId));
  }
  return posts.slice().sort((a, b) => b.ts - a.ts);
}
function postById(id) { return MOCK_POSTS.find(p => p.id === id); }

function createPost(text, image) {
  const post = {
    id: 'p' + Date.now(),
    authorId: 'me',
    ts: Date.now(),
    text: text,
    image: image || null,
    likedBy: [],
    shares: 0,
    comments: [],
  };
  MOCK_POSTS.unshift(post);
  saveState();
  return post;
}
function deletePost(id) {
  const i = MOCK_POSTS.findIndex(p => p.id === id);
  if (i >= 0 && MOCK_POSTS[i].authorId === 'me') { MOCK_POSTS.splice(i, 1); saveState(); return true; }
  return false;
}
function editPost(id, text) {
  const p = postById(id);
  if (p && p.authorId === 'me') { p.text = text; p.edited = true; saveState(); return true; }
  return false;
}
function togglePostLike(id) {
  const p = postById(id);
  const i = p.likedBy.indexOf('me');
  if (i >= 0) p.likedBy.splice(i, 1); else p.likedBy.push('me');
  saveState();
  return i < 0;
}
function isPostLiked(id) { const p = postById(id); return p && p.likedBy.indexOf('me') >= 0; }
function sharePost(id) { const p = postById(id); p.shares += 1; saveState(); return p.shares; }

function toggleSave(postId) {
  const list = STATE.user.saved = STATE.user.saved || [];
  const i = list.indexOf(postId);
  if (i >= 0) list.splice(i, 1); else list.push(postId);
  saveState();
  return i < 0;
}
function isSaved(postId) { return (STATE.user.saved || []).indexOf(postId) >= 0; }
function savedPosts() {
  return (STATE.user.saved || []).map(postById).filter(Boolean);
}
function postsByAuthor(userId) {
  return MOCK_POSTS.filter(p => p.authorId === userId).sort((a, b) => b.ts - a.ts);
}

/* ---------- Comments (threaded, one reply level) ---------- */
function commentCount(post) { return post.comments.length; }

/* Returns top-level comments each with their replies attached. */
function threadComments(post) {
  const tops = post.comments.filter(c => !c.parentId && !isHidden(c.authorId));
  return tops.map(c => ({
    comment: c,
    replies: post.comments.filter(r => r.parentId === c.id && !isHidden(r.authorId))
                          .sort((a, b) => a.ts - b.ts),
  })).sort((a, b) => a.comment.ts - b.comment.ts);
}
function addComment(postId, text, parentId) {
  const p = postById(postId);
  if (!p) return null;
  const c = {
    id: 'c' + Date.now(),
    authorId: 'me',
    ts: Date.now(),
    text: text,
    likedBy: [],
    parentId: parentId || null,
  };
  p.comments.push(c);
  saveState();
  return c;
}
function deleteComment(postId, commentId) {
  const p = postById(postId);
  if (!p) return false;
  const c = p.comments.find(x => x.id === commentId);
  if (!c || c.authorId !== 'me') return false;
  // Removing a parent removes its replies too.
  p.comments = p.comments.filter(x => x.id !== commentId && x.parentId !== commentId);
  saveState();
  return true;
}
function toggleCommentLike(postId, commentId) {
  const p = postById(postId);
  const c = p.comments.find(x => x.id === commentId);
  const i = c.likedBy.indexOf('me');
  if (i >= 0) c.likedBy.splice(i, 1); else c.likedBy.push('me');
  saveState();
  return i < 0;
}

/* ---------- Hashtags and mentions ---------- */
function extractTags(text) {
  const out = [];
  const re = /#([a-z0-9_]+)/gi;
  let m;
  while ((m = re.exec(text)) !== null) if (out.indexOf(m[1].toLowerCase()) < 0) out.push(m[1].toLowerCase());
  return out;
}
function trendingTags(limit) {
  const counts = {};
  MOCK_POSTS.forEach(p => {
    if (isHidden(p.authorId)) return;
    extractTags(p.text).forEach(t => { counts[t] = (counts[t] || 0) + 1; });
  });
  return Object.keys(counts)
    .map(t => ({ tag: t, count: counts[t] }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, limit || 8);
}
function postsWithTag(tag) {
  const t = String(tag).toLowerCase();
  return MOCK_POSTS.filter(p => !isHidden(p.authorId) && extractTags(p.text).indexOf(t) >= 0)
                   .sort((a, b) => b.ts - a.ts);
}

/* ---------- Search ---------- */
function searchAll(query) {
  const q = String(query || '').trim().toLowerCase().replace(/^[#@]/, '');
  if (!q) return { people: [], posts: [], tags: [] };
  const people = MOCK_USERS.filter(u =>
    !isBlocked(u.id) && (u.handle.toLowerCase().indexOf(q) >= 0 ||
    (u.name && u.name.toLowerCase().indexOf(q) >= 0) ||
    u.bio.toLowerCase().indexOf(q) >= 0));
  const posts = MOCK_POSTS.filter(p => !isHidden(p.authorId) && p.text.toLowerCase().indexOf(q) >= 0)
                          .sort((a, b) => b.ts - a.ts);
  const tags = trendingTags(50).filter(t => t.tag.indexOf(q) >= 0);
  return { people: people, posts: posts, tags: tags };
}

/* ---------- Direct messages ---------- */
function threadFor(userId) { return MOCK_DM_THREADS[userId] || (MOCK_DM_THREADS[userId] = []); }
function unreadDMCount(userId) {
  return threadFor(userId).filter(m => !m.me && !m.read).length;
}
function totalUnreadDMs() {
  return Object.keys(MOCK_DM_THREADS).reduce((n, id) => isHidden(id) ? n : n + unreadDMCount(id), 0);
}
function markThreadRead(userId) {
  threadFor(userId).forEach(m => { if (!m.me) m.read = true; });
  saveState();
}
function sendMessage(userId, text) {
  const msg = { id: 'd' + Date.now(), me: true, text: text, ts: Date.now(), read: false };
  threadFor(userId).push(msg);
  saveState();
  return msg;
}
function lastMessage(userId) {
  const t = threadFor(userId);
  return t.length ? t[t.length - 1] : null;
}
/* Conversations ordered by recency, like any messaging app. */
function conversations() {
  return MOCK_USERS.filter(u => !isBlocked(u.id)).map(u => {
    const last = lastMessage(u.id);
    return { user: u, last: last, unread: unreadDMCount(u.id), ts: last ? last.ts : 0 };
  }).sort((a, b) => b.ts - a.ts);
}

/* ---------- Notifications ---------- */
function pushNotification(n) {
  STATE.notifications.unshift(Object.assign({
    id: 'n' + Date.now(),
    ts: Date.now(),
    read: false,
    section: 'pack',
    subsection: 'wall',
  }, n));
  if (STATE.notifications.length > 60) STATE.notifications.pop();
  saveState();
}
function unreadNotifications() { return STATE.notifications.filter(n => !n.read); }
function unreadForSection(sectionId) {
  return STATE.notifications.filter(n => n.section === sectionId && !n.read);
}
function markAllNotificationsRead() {
  STATE.notifications.forEach(n => { n.read = true; });
  saveState();
}
