function initScriptProperties(){
  PropertiesService.getScriptProperties().setProperty("sheetId", SpreadsheetApp.getActiveSpreadsheet().getId());
}

function doGet(e){
  let DISLIKE_DATA = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("sheetId")).getSheetByName("dislike_data");
  let USER_REGISTRY = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("sheetId")).getSheetByName("user_registry");
  let TEMP_STORAGE = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("sheetId")).getSheetByName("temp_storage");
  let lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try{
    if (e.parameter.mode == "get"){
      if (!e.parameter.posts) throw new Error("Post array not provided");
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
      if (!e.parameter.post) throw new Error("Post not provided");
      let post = e.parameter.post;
      if (post.includes('=')) throw new Error("Request cannot have equals sign (=).");
      if (!e.parameter.uid) throw new Error("UID (User ID) not provided");
      let uid = e.parameter.uid;
      let row = DISLIKE_DATA.getRange("A:A").offset(1, 0).createTextFinder("^$").useRegularExpression(true).matchEntireCell(true).findNext();
      if (row == null) row = DISLIKE_DATA.getLastRow() + 1;
      else row = row.getRowIndex();
      let foundUser = USER_REGISTRY.getRange("A:A").offset(1, 0).createTextFinder(uid).matchEntireCell(true).matchCase(true).findAll().length > 0;
      if (!foundUser){
        throw new ReferenceError("User ID not found");
      }
      let dislikes = DISLIKE_DATA.getRange("A:A").offset(1, 0).createTextFinder(post).matchEntireCell(true).matchCase(true).findAll();
      for (let i = 0; i < dislikes.length; ++i){
        if (dislikes[i].offset(0, 1).getValue() == uid) throw new Error('User already disliked this post');
      }
      DISLIKE_DATA.getRange(row, 1, 1, 2).setValues([[post, uid]]);
      return ContentService.createTextOutput(JSON.stringify({"success": true, "operation": "add", "output": {"post": post, "uid": uid}})).setMimeType(ContentService.MimeType.JSON);
    }
    else if (e.parameter.mode == "remove"){
      if (!e.parameter.post) throw new Error("Post not provided");
      let post = e.parameter.post;
      if (!e.parameter.uid) throw new Error("UID (User ID) not provided");
      let uid = e.parameter.uid;
      let dislikes = DISLIKE_DATA.getRange("A:A").offset(1, 0).createTextFinder(post).matchEntireCell(true).matchCase(true).findAll();
      for (let i = 0; i < dislikes.length; ++i){
        if (dislikes[i].offset(0, 1).getValue() == uid){
          DISLIKE_DATA.getRange(dislikes[i].getRow(), 1, 1, 2).setValues([["", ""]]);
          return ContentService.createTextOutput(JSON.stringify({"success": true, "operation": "remove", "output": {"post": post, "uid": uid}})).setMimeType(ContentService.MimeType.JSON);
        }
      }
      throw new Error("Dislike not found");

    }
    else if (e.parameter.mode == "sendEmail"){
      if (!e.parameter.email) throw new Error("Please provide your Kehillah email.");
      if (!/^([\w\-]*20\d\d@kehillahstudent\.org|[\w\-]*@kehillah\.org)$/.test(e.parameter.email)) throw new Error("Please provide a valid Kehillah email.");
      let email = e.parameter.email;
      if (!e.parameter.uid) throw new Error("UID (User ID) not provided");
      let uid = e.parameter.uid;
      let foundUid = (USER_REGISTRY.getRange("A:A").offset(1, 0).createTextFinder(uid).matchEntireCell(true).matchCase(true).findNext() != null);
      let foundEmail = (USER_REGISTRY.getRange("B:B").offset(1, 0).createTextFinder(email).matchEntireCell(true).matchCase(true).findNext() != null);
      if (foundUid) return ContentService.createTextOutput(JSON.stringify({"success": false, "operation": "sendEmail", "output": {"message": "User ID (uid) already in use"}})).setMimeType(ContentService.MimeType.JSON);
      if (foundEmail) return ContentService.createTextOutput(JSON.stringify({"success": false, "operation": "sendEmail", "output": {"message": "Email already in use"}})).setMimeType(ContentService.MimeType.JSON);
  
      let code = 'xxxxxx'.replace(/x/g, () => {return Math.floor(Math.random() * 10)});
      let row;
      let rowCell = TEMP_STORAGE.getRange("A:A").offset(1, 0).createTextFinder(email).matchEntireCell(true).matchCase(true).findNext();
      if (rowCell == null) rowCell = TEMP_STORAGE.getRange("A:A").offset(1, 0).createTextFinder("^$").useRegularExpression(true).matchEntireCell(true).findNext();
      if (rowCell == null) row = TEMP_STORAGE.getLastRow() + 1;
      if (rowCell != null) row = rowCell.getRowIndex();
      TEMP_STORAGE.getRange(row, 1, 1, 3).setValues([[email, uid, code]]);
      MailApp.sendEmail(email, "Schoology dislike extension verification code", "Your verification code for the Schoology dislike extension is " + code + ". If you are recieving this email in error, please notify me (bdomine2024@kehillahstudent.org) immediately.");
      return ContentService.createTextOutput(JSON.stringify({"success": true, "operation": "sendEmail", "output": {"email": email, "uid": uid}})).setMimeType(ContentService.MimeType.JSON);
    }
    else if (e.parameter.mode == "verifyUser"){
      if (!e.parameter.code) throw new Error("Please use the verification code sent to your Kehillah email.");
      let code = e.parameter.code;
      if (!e.parameter.uid) throw new Error("UID (User ID) not provided");
      let uid = e.parameter.uid;
      let tempCell = TEMP_STORAGE.getRange("B:B").offset(1, 0).createTextFinder(uid).matchEntireCell(true).matchCase(true).findNext();
      if (tempCell == null) return ContentService.createTextOutput(JSON.stringify({"success": false, "operation": "verifyUser", "output": {"message": "User ID (uid) not found"}})).setMimeType(ContentService.MimeType.JSON);

      if (tempCell.offset(0, 1).getValue() == code){
        let email = tempCell.offset(0, -1).getValue();
        let row = USER_REGISTRY.getRange("A:A").offset(1, 0).createTextFinder("^$").useRegularExpression(true).matchEntireCell(true).findNext();
        if (row == null) row = USER_REGISTRY.getLastRow() + 1;
        else row = row.getRowIndex();
        USER_REGISTRY.getRange(row, 1, 1, 2).setValues([[uid, email]]);
        TEMP_STORAGE.getRange(tempCell.getRowIndex(), 1, 1, 3).setValues([["", "", ""]]);
        return ContentService.createTextOutput(JSON.stringify({"success": true, "operation": "verifyUser", "output": {"email": email, "uid": uid}})).setMimeType(ContentService.MimeType.JSON);
      }
      else{
        return ContentService.createTextOutput(JSON.stringify({"success": false, "operation": "verifyUser", "output": {"message": "Incorrect code"}})).setMimeType(ContentService.MimeType.JSON);
      }
      
    }
  }
    
  catch (e){
    return ContentService.createTextOutput(JSON.stringify({"success": false, "output": {"type": e.type, "message": e.message}})).setMimeType(ContentService.MimeType.JSON);
  }
  finally{
    lock.releaseLock();
  }
}
