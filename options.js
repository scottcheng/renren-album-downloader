$(function() {
  if (localStorage['originalSize'] === 'true') {
    $('#original-size').attr('checked', true);
  }

  $('input#original-size').change(function() {
    localStorage['originalSize'] = $(this).is(':checked');
  });
});