import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RoutesConfig, RoutingConfigService } from '@spartacus/core';
import { of } from 'rxjs';
import { defaultStorefrontRoutesConfig } from '../../../cms-structure/routing/default-routing-config';
import {
  CheckoutConfig,
  DeliveryModePreferences,
} from '../config/checkout-config';
import { defaultCheckoutConfig } from '../config/default-checkout-config';
import { CheckoutStep } from '../model';
import { CheckoutConfigService } from './checkout-config.service';

const mockCheckoutConfig: CheckoutConfig = JSON.parse(
  JSON.stringify(defaultCheckoutConfig)
);

const mockCheckoutSteps: Array<CheckoutStep> =
  mockCheckoutConfig.checkout.steps;

const mockRoutingConfig: RoutesConfig = JSON.parse(
  JSON.stringify(defaultStorefrontRoutesConfig)
);

class MockActivatedRoute {
  snapshot = of();
}

class MockRoutingConfigService {
  getRouteConfig(routeName: string) {
    return mockCheckoutConfig[routeName].paths[0];
  }
}

const [FREE_CODE, STANDARD_CODE, PREMIUM_CODE] = [
  'free-gross',
  'standard-gross',
  'premium-gross',
];
const [freeMode, standardMode, premiumMode] = [
  { deliveryCost: { value: 0 }, code: FREE_CODE },
  { deliveryCost: { value: 2 }, code: STANDARD_CODE },
  { deliveryCost: { value: 3 }, code: PREMIUM_CODE },
];

describe('CheckoutConfigService', () => {
  let service: CheckoutConfigService;
  let activatedRoute: ActivatedRoute;
  let routingConfigService: RoutingConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: mockCheckoutConfig, useClass: CheckoutConfig },
        { provide: ActivatedRoute, useClass: MockActivatedRoute },
        { provide: RoutingConfigService, useClass: MockRoutingConfigService },
      ],
    });

    activatedRoute = TestBed.inject(ActivatedRoute);
    routingConfigService = TestBed.inject(RoutingConfigService);

    service = new CheckoutConfigService(
      mockCheckoutConfig,
      routingConfigService
    );
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get checkout step by type', () => {
    const type = mockCheckoutSteps[0].type[0];
    expect(service.getCheckoutStep(type)).toEqual(mockCheckoutSteps[0]);
  });

  it('should get checkout step route by type', () => {
    const type = mockCheckoutSteps[0].type[0];

    expect(service.getCheckoutStepRoute(type)).toEqual(
      mockCheckoutSteps[0].routeName
    );
  });

  it('should get first checkout step route', () => {
    expect(service.getFirstCheckoutStepRoute()).toEqual(
      mockCheckoutSteps[0].routeName
    );
  });

  it('should get next checkout step url', () => {
    const activeStepIndex = 1;

    spyOn<any>(service, 'getStepUrlFromActivatedRoute').and.returnValue(
      '/' +
        mockRoutingConfig[mockCheckoutSteps[activeStepIndex].routeName].paths[0]
    );

    spyOn<any>(service, 'getStepUrlFromStepRoute').and.callFake((route) => {
      return mockRoutingConfig[route].paths[0];
    });

    expect(service.getNextCheckoutStepUrl(activatedRoute)).toBe(
      mockRoutingConfig[mockCheckoutSteps[activeStepIndex + 1].routeName]
        .paths[0]
    );
  });

  it('should get prev checkout step url', () => {
    const activeStepIndex = 1;

    spyOn<any>(service, 'getStepUrlFromActivatedRoute').and.returnValue(
      '/' +
        mockRoutingConfig[mockCheckoutSteps[activeStepIndex].routeName].paths[0]
    );

    spyOn<any>(service, 'getStepUrlFromStepRoute').and.callFake((route) => {
      return mockRoutingConfig[route].paths[0];
    });

    expect(service.getPreviousCheckoutStepUrl(activatedRoute)).toBe(
      mockRoutingConfig[mockCheckoutSteps[activeStepIndex - 1].routeName]
        .paths[0]
    );
  });

  it('should return current step index', () => {
    const activeStepIndex = 1;

    spyOn<any>(service, 'getStepUrlFromActivatedRoute').and.returnValue(
      '/' +
        mockRoutingConfig[mockCheckoutSteps[activeStepIndex].routeName].paths[0]
    );

    spyOn<any>(service, 'getStepUrlFromStepRoute').and.callFake((route) => {
      return mockRoutingConfig[route].paths[0];
    });

    expect(service.getCurrentStepIndex(activatedRoute)).toBe(1);
  });

  describe('compareDeliveryCost', () => {
    it('should return 1 for higher price', () => {
      expect(
        service['compareDeliveryCost'](
          { deliveryCost: { value: 4 } },
          { deliveryCost: { value: 2 } }
        )
      ).toBe(1);
    });

    it('should return -1 for lower price', () => {
      expect(
        service['compareDeliveryCost'](
          { deliveryCost: { value: 5 } },
          { deliveryCost: { value: 7 } }
        )
      ).toBe(-1);
    });

    it('should return 0 for same price', () => {
      expect(
        service['compareDeliveryCost'](
          { deliveryCost: { value: 1 } },
          { deliveryCost: { value: 1 } }
        )
      ).toBe(0);
    });
  });

  describe('getPreferredDeliveryMode', () => {
    it('should call findMatchingDeliveryMode with ordered modes by price', () => {
      const findMatchingDeliveryMode = spyOn(
        service,
        'findMatchingDeliveryMode' as any
      );

      service.getPreferredDeliveryMode([standardMode, freeMode, premiumMode]);
      expect(findMatchingDeliveryMode).toHaveBeenCalledWith([
        freeMode,
        standardMode,
        premiumMode,
      ]);

      service.getPreferredDeliveryMode([premiumMode, standardMode]);
      expect(findMatchingDeliveryMode).toHaveBeenCalledWith([
        standardMode,
        premiumMode,
      ]);
    });
  });

  describe('findMatchingDeliveryMode', () => {
    it('should return free or lower possible price code', () => {
      service['defaultDeliveryMode'] = [DeliveryModePreferences.FREE];

      expect(
        service['findMatchingDeliveryMode']([
          freeMode,
          standardMode,
          premiumMode,
        ])
      ).toBe(FREE_CODE);

      expect(
        service['findMatchingDeliveryMode']([standardMode, premiumMode])
      ).toBe(STANDARD_CODE);

      expect(service['findMatchingDeliveryMode']([premiumMode])).toBe(
        PREMIUM_CODE
      );
    });

    it('should return least expensive (but not free, if available) price code', () => {
      service['defaultDeliveryMode'] = [
        DeliveryModePreferences.LEAST_EXPENSIVE,
      ];

      expect(
        service['findMatchingDeliveryMode']([
          freeMode,
          standardMode,
          premiumMode,
        ])
      ).toBe(STANDARD_CODE);

      expect(
        service['findMatchingDeliveryMode']([standardMode, premiumMode])
      ).toBe(STANDARD_CODE);

      expect(service['findMatchingDeliveryMode']([freeMode, premiumMode])).toBe(
        PREMIUM_CODE
      );

      service['defaultDeliveryMode'] = [
        DeliveryModePreferences.LEAST_EXPENSIVE,
        DeliveryModePreferences.FREE,
      ];
      expect(service['findMatchingDeliveryMode']([freeMode])).toBe(FREE_CODE);
    });

    it('should return free, or most expensive price code if free is not available', () => {
      service['defaultDeliveryMode'] = [
        DeliveryModePreferences.FREE,
        DeliveryModePreferences.MOST_EXPENSIVE,
      ];

      expect(
        service['findMatchingDeliveryMode']([
          freeMode,
          standardMode,
          premiumMode,
        ])
      ).toBe(FREE_CODE);

      expect(
        service['findMatchingDeliveryMode']([standardMode, premiumMode])
      ).toBe(PREMIUM_CODE);

      expect(service['findMatchingDeliveryMode']([standardMode])).toBe(
        STANDARD_CODE
      );
    });

    it('should return matching code', () => {
      service['defaultDeliveryMode'] = [FREE_CODE];

      expect(
        service['findMatchingDeliveryMode']([
          freeMode,
          standardMode,
          premiumMode,
        ])
      ).toBe(FREE_CODE);

      service['defaultDeliveryMode'] = [STANDARD_CODE];
      expect(
        service['findMatchingDeliveryMode']([
          freeMode,
          standardMode,
          premiumMode,
        ])
      ).toBe(STANDARD_CODE);

      service['defaultDeliveryMode'] = [PREMIUM_CODE];
      expect(
        service['findMatchingDeliveryMode']([
          freeMode,
          standardMode,
          premiumMode,
        ])
      ).toBe(PREMIUM_CODE);

      service['defaultDeliveryMode'] = [
        'not_existing_code1',
        'not_existing_code2',
      ];
      expect(
        service['findMatchingDeliveryMode']([
          freeMode,
          standardMode,
          premiumMode,
        ])
      ).toBe(FREE_CODE);

      service['defaultDeliveryMode'] = [
        'not_existing_code1',
        'not_existing_code2',
        'existing_code',
        STANDARD_CODE,
      ];
      expect(
        service['findMatchingDeliveryMode']([
          freeMode,
          standardMode,
          premiumMode,
        ])
      ).toBe(STANDARD_CODE);
      expect(
        service['findMatchingDeliveryMode']([
          freeMode,
          { deliveryCost: { value: 1 }, code: 'existing_code' },
          standardMode,
          premiumMode,
        ])
      ).toBe('existing_code');
    });

    it('should return first option if defaultDeliveryMode is empty', () => {
      service['defaultDeliveryMode'] = [];
      expect(
        service['findMatchingDeliveryMode']([
          freeMode,
          standardMode,
          premiumMode,
        ])
      ).toBe(FREE_CODE);
    });
  });

  describe('isExpressCheckout', () => {
    it('return default config value', () => {
      expect(service.isExpressCheckout()).toBeFalsy();
    });

    it('return true for express turned on', () => {
      service['express'] = true;
      expect(service.isExpressCheckout()).toBeTruthy();
    });
  });
});
