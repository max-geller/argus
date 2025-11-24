import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Keybindings } from './keybindings';

describe('Keybindings', () => {
  let component: Keybindings;
  let fixture: ComponentFixture<Keybindings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Keybindings]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Keybindings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
