let countries = []

var geoip = module.exports = {

  ready: false,

  lookup: function (ip) {
    if (!geoip.ready) {
      return { error: 'GeoIP not ready' }
    }

    var ipl = iplong(ip)

    if (ipl == 0) {
      return { error: 'Invalid ip address ' + ip + ' -> ' + ipl + ' as integer' }
    }

    return find(ipl, 0, countries.length - 1)
  }
}

function iplong (ip) {
  if (!ip) {
    return 0
  }

  ip = ip.toString()

  if (isNaN(ip) && ip.indexOf('.') == -1) {
    return 0
  }

  if (ip.indexOf('.') == -1) {
    try {
      ip = parseFloat(ip)
      return ip < 0 || ip > 4294967296 ? 0 : ip
    } catch (s) {
    }
  }

  var parts = ip.split('.')

  if (parts.length != 4) {
    return 0
  }

  var ipl = 0

  for (var i = 0; i < 4; i++) {
    parts[i] = parseInt(parts[i], 10)

    if (parts[i] < 0 || parts[i] > 255) {
      return 0
    }

    ipl += parts[3 - i] * (Math.pow(256, i))
  }

  return ipl > 4294967296 ? 0 : ipl
}

/**
 * A quick little binary search
 * @param ip the ip we're looking for
 * @return {*}
 */
function find (ipl, start, end) {
    // Check to see if we have converged
  if (start >= end) {
    return countries[start]
  }

  // Check midpoint
  let mid = Math.floor((start + end) / 2)
  if (ipl >= countries[mid].ipstart && ipl <= countries[mid].ipend) {
    return countries[mid]
  }

  // Check for less
  if (ipl < countries[mid].ipstart) {
    return find(ipl, start, mid - 1)
  }

  // Check for more
  if (ipl > countries[mid].ipend) {
    return find(ipl, mid + 1, end)
  }

  // Should not get here
  return null
}

/**
* Prepare the data.  This uses the standard free GeoIP CSV database
* from MaxMind, you should be able to update it at any time by just
* overwriting GeoIPCountryWhois.csv with a new version.
*/
(function () {
  var fs = require('fs')

  var stream = fs.createReadStream(__dirname + '/GeoIPCountryWhois.csv')
  var buffer = ''

  stream.addListener('data', function (data) {
    buffer += data.toString().replace(/"/g, '')
  })

  stream.addListener('end', function () {
    var entries = buffer.split('\n')

    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i].split(',')

      // Ensure valid
      if (entry[4] && entry[5]) {
        countries.push({ipstart: parseInt(entry[2]), ipend: parseInt(entry[3]), code: entry[4], name: entry[5]})
      }
    }

    countries.sort(function (a, b) {
      return a.ipstart - b.ipstart
    })

    geoip.ready = true
  })
}())
