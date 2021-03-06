goog.require('gmf.contextualdataDirective');
goog.require('gmf.mapDirective');
goog.require('gmf.Altitude');

describe('gmf.contextualdataDirective', function() {

  var $compile;
  var $document;
  var contextualdataController;
  var map;
  var $httpBackend;
  var callbackSpy;

  beforeEach(inject(function($injector, _$httpBackend_, _$rootScope_, _$compile_, _$document_) {
    var $rootScope = _$rootScope_;
    $compile = _$compile_;
    $document = _$document_;
    $httpBackend = _$httpBackend_;

    var element = angular.element(
      '<gmf-map gmf-map-map="map" gmf-contextualdata="" gmf-contextualdata-map="::map" gmf-contextualdata-projections="[4326,3857]" gmf-contextualdata-callback="callback"></gmf-map>');
    element.css({
      position: 'absolute',
      top: 10,
      left: 20,
      width: 800,
      height: 400
    });
    angular.element($document[0].body).append(element);
    var scope = $rootScope.$new();

    map = new ol.Map({
      view: new ol.View({
        center: [0, 0],
        zoom: 0,
        projection: 'EPSG:4326'
      })
    });
    scope.map = map;
    callbackSpy = jasmine.createSpy();
    scope.callback = function(coordinate, data) {
      callbackSpy();
      return {
        'extra_value': data.elevation * 2
      };
    };
    $compile(element)(scope);
    scope.$digest();

    contextualdataController = scope.cdCtrl;

    // mock getCoordinateFromPixel & getPixelFromCoordinate
    // since map has no frameState yet
    map.getCoordinateFromPixel = function(pixel) {
      return [1, 2];
    };
    map.getPixelFromCoordinate = function(coordinate) {
      return [50, 100];
    };

    // mock the template
    var html = '';
    html += '{{coord_4326_eastern}},{{coord_4326_northern}},';
    html += '{{coord_3857_eastern}},{{elevation}},';
    html += '{{extra_value}}';
    $httpBackend.whenGET('contextualdata.html').respond(html);

    $httpBackend.whenGET('https://fake/gmf/raster?lat=2&lon=1').respond({
      'elevation': 1234
    });
  }));

  afterEach(function() {
    map.setTarget(null);
  });

  describe('#init', function() {
    it('creates a popover container', function() {
      var popover = $document.find('div.popover');
      expect(popover.length).toBe(1);
    });
  });

  describe('#popover', function() {
    it('popover content is correct', function() {
      var event = {
        clientX: 100,
        clientY: 200,
        preventDefault: function() {}
      };
      contextualdataController.handleMapContextMenu_(event);
      // make sure the template for contextualdatacontent directive is loaded
      $httpBackend.flush();
      var content = $document.find('div.popover-content')[0].innerHTML;
      expect(content).toBe('1,2,111319.49079327358,1234,2468');
      expect(callbackSpy.calls.count()).toBe(1);
    });
  });
});
