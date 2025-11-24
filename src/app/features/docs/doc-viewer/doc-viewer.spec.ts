import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocViewer } from './doc-viewer';

describe('DocViewer', () => {
  let component: DocViewer;
  let fixture: ComponentFixture<DocViewer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocViewer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocViewer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
