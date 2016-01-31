var _ = require('underscore');

/**
 * Tracks are the same if their timestamps are the same and their names are the same.
 * @param  {Object}  track1 The first scrobble.
 * @param  {Object}  track2 The second scrobble.
 * @return {boolean} Whether the tracks should be considered the same.
 */
exports.isSameScrobble = function(track1, track2) {
  return track1.date.uts === track2.date.uts && track1.name === track2.name;
};

exports.getDuplicates = function(tracks) {
  var scrobbles = {};
  var duplicates = [];
  for (var i = 0, len = tracks.length; i < len; i++) {
    var track = tracks[i];
    var uts = parseInt(track.date.uts, 10);

    if (scrobbles[uts] === undefined) {
      scrobbles[uts] = track;
    } else if (exports.isSameScrobble(scrobbles[uts], track)) {
      duplicates.push(track);
    }
  }

  return duplicates;
};

exports.augmentTrackData = function(tracks, user) {
  _.forEach(tracks, function(track) {
    track.artist.name = track.artist['#text'];
    track.date.text = track.date['#text'];

    var lastfmTrackListing = 'http://last.fm/user/' + user + '/library/music/' +
      encodeURIComponent(track.artist.name) + '/_/' + encodeURIComponent(track.name);

    // Make it pretty like last.fm's urls by replacing %20 with +.
    track.listing = lastfmTrackListing.replace(/%20/g, '+');

    var removeUri = '/remove/' + track.artist.name + '/' + track.name + '/' + track.date.uts;
    track.removeUrl = encodeURI(removeUri);
  });
};
