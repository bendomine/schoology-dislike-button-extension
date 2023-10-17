function initScriptProperties(){
  PropertiesService.getScriptProperties().setProperty("sheetId", SpreadsheetApp.getActiveSpreadsheet().getId());
}

// function test(){
//   let DISLIKE_DATA = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("sheetId")).getSheetByName("dislike_data");
//   let USER_REGISTRY = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("sheetId")).getSheetByName("user_registry");
//   let postRows = DISLIKE_DATA.getRange("A:A").offset(1, 0).createTextFinder("testing").matchEntireCell(true).matchCase(true).findAll();
//   for (let i = 0; i < postRows.length; ++i){
    
//   }
// }

function doGet(e){
  let DISLIKE_DATA = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("sheetId")).getSheetByName("dislike_data");
  let USER_REGISTRY = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("sheetId")).getSheetByName("user_registry");
  let lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try{
    if (e.parameter.mode == "get"){
      let posts = JSON.parse(e.parameter.posts);
      let dislikes = [];
      for (let i = 0; i < posts.length; ++i){
        let rows = DISLIKE_DATA.getRange("A:A").offset(1, 0).createTextFinder(posts[i]).matchEntireCell(true).matchCase(true).findAll();
        let dislikedByUser = false;
        for (let j = 0; j < rows.length; ++j){
          if (rows[j].offset(0, 1).getValue() == e.parameter.uid){
            dislikedByUser = true;
            break;
          }
        }
        dislikes.push({'postId': posts[i], 'dislikes': rows.length, 'dislikedByUser': dislikedByUser});
      }
      return ContentService.createTextOutput(JSON.stringify({"success": true, "operation": "get", "output": dislikes})).setMimeType(ContentService.MimeType.JSON);
    }
    else if (e.parameter.mode == "add"){
      let post = e.parameter.post;
      let uid = e.parameter.uid;
      let foundUser = USER_REGISTRY.getRange("A:A").offset(1, 0).createTextFinder(uid).matchEntireCell(true).matchCase(true).findAll().length > 0;
      if (!foundUser){
        throw new ReferenceError("User ID not found");
      }
      let dislikes = DISLIKE_DATA.getRange("A:A").offset(1, 0).createTextFinder(post).matchEntireCell(true).matchCase(true).findAll();
      for (let i = 0; i < dislikes.length; ++i){
        if (dislikes[i].offset(0, 1).getValue() == uid) throw new Error('User already disliked this post');
      }
      DISLIKE_DATA.getRange(DISLIKE_DATA.getLastRow() + 1, 1, 1, 2).setValues([[post, uid]]);
      return ContentService.createTextOutput(JSON.stringify({"success": true, "operation": "add", "output": {"post": post, "uid": uid}})).setMimeType(ContentService.MimeType.JSON);
    }
  }
  catch (e){
    return ContentService.createTextOutput(JSON.stringify({"success": false, "output": {"type": e.type, "message": e.message}})).setMimeType(ContentService.MimeType.JSON);
  }
  finally{
    lock.releaseLock();
  }
}
