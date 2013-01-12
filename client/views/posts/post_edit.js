// Template.post_edit.preserve(['#title', '#url', '#editor', '#sticky']);

// Template.post_edit.preserve({
//   // 'input[id]': function (node) { return node.id; }
//    '[name]': function(node) { return node.getAttribute('name');}
// });

Template.post_edit.helpers({
  post: function(){
    return Posts.findOne(Session.get('selectedPostId'));
  },
  created: function(){
    var post= Posts.findOne(Session.get('selectedPostId'));
    return moment(post.createdAt).format("MMMM Do, h:mm:ss a");
  },
  categories: function(){
    return Categories.find();
  },
  isChecked: function(){
    var post= Posts.findOne(Session.get('selectedPostId'));
    return $.inArray( this.name, post.categories) != -1 ? 'checked' : '';
  },
  isApproved: function(){
    var post= Posts.findOne(Session.get('selectedPostId'));
    return post.status == STATUS_APPROVED;
  },
  submittedDate: function(){
    return moment(this.submitted).format("MM/DD/YYYY");
  },
  submittedTime: function(){
    return moment(this.submitted).format("HH:mm");
  },
  users: function(){
    return Meteor.users.find();
  },
  userName: function(){
    return getDisplayName(this);
  },
  isSelected: function(){
    var post=Posts.findOne(Session.get('selectedPostId'));
    return post && this._id == post.userId ? 'selected' : '';
  },
  statusPending: function(){
    return this.status == STATUS_PENDING;
  },
  statusApproved: function(){
    return this.status == STATUS_APPROVED;
  },
  statusRejected: function(){
    return this.status == STATUS_REJECTED;
  },  
});

Template.post_edit.rendered = function(){
  var post= Posts.findOne(Session.get('selectedPostId'));
  if(post && !this.editor){

    this.editor= new EpicEditor(EpicEditorOptions).load();  
    this.editor.importFile('editor',post.body);

    $('#submitted_date').datepicker();

  }
}

Template.post_edit.events = {
  'click input[type=submit]': function(e, instance){
    e.preventDefault();
    if(!Meteor.user()){
      throwError('You must be logged in.');
      return false;
    }

    var selectedPostId=Session.get('selectedPostId');
    var post = Posts.findOne(selectedPostId);
    var categories = [];
    var url = $('#url').val();
    var status = parseInt($('input[name=status]:checked').val());

    $('input[name=category]:checked').each(function() {
       categories.push($(this).val());
    });
    
    var properties = {
      headline:         $('#title').val(),
      url:              (url.substring(0, 7) == "http://" || url.substring(0, 8) == "https://") ? url : "http://"+url,
      body:             instance.editor.exportFile(),
      categories:       categories,
    };
    
    if(isAdmin(Meteor.user())){
      if(status == STATUS_APPROVED){
        // if post is approved, set submitted timestamp to current date or form field date
        properties.submitted = (post.submitted == '') ? new Date().getTime() : parseInt(moment($('#submitted_date').val()+$('#submitted_time').val(), "MM/DD/YYYY HH:mm").valueOf());
      }
      adminProperties = {
        sticky:     !!$('#sticky').attr('checked'),
        userId:     $('#postUser').val(),
        status:     parseInt($('input[name=status]:checked').val()),
      };
      properties = _.extend(properties, adminProperties);
    }

    Posts.update(selectedPostId,
    {
        $set: properties
      }
    ,function(error){
      if(error){
        throwError(error.reason);
      }else{
        trackEvent("edit post", {'postId': selectedPostId});
        Meteor.Router.to("/posts/"+selectedPostId);
      }
    }
    );
  }

  , 'click .delete-link': function(e){
    e.preventDefault();
    if(confirm("Are you sure?")){
      var selectedPostId=Session.get('selectedPostId');
      Posts.remove(selectedPostId);
      Meteor.Router.to("/posts/deleted");
    }
  }
};