angular.module('chatDirective', [])
  .controller('Ctrl', function($scope) {
    $scope.nextree = { name: 'Nextree' };
  })
  .directive('sendDirective', function() {
    return {
      restrict: 'E',
      scope: {
        myCompany: '=companyInfo'
      },
      template: 'Name:{{myCompany.name}}'
    };
  });
