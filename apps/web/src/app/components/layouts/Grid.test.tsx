import React from 'react'
import { render, screen } from '@/test-utils'
import { Grid, GridItem } from './Grid'

describe('Grid Components', () => {
  describe('Grid', () => {
    it('should render children', () => {
      render(
        <Grid>
          <div data-testid="child">Child content</div>
        </Grid>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(
        <Grid className="custom-grid">
          <div>Content</div>
        </Grid>
      )

      expect(container.firstChild).toHaveClass('custom-grid')
      expect(container.firstChild).toHaveClass('optimized-content-grid')
    })
  })

  describe('GridItem', () => {
    it('should render with default span of 1', () => {
      render(
        <GridItem>
          <div data-testid="item">Item content</div>
        </GridItem>
      )

      const item = screen.getByTestId('item').parentElement
      expect(item).toHaveClass('grid-item')
      expect(item).toHaveClass('span-1')
    })

    it('should render with custom span', () => {
      render(
        <GridItem span={2}>
          <div data-testid="item">Item content</div>
        </GridItem>
      )

      const item = screen.getByTestId('item').parentElement
      expect(item).toHaveClass('span-2')
    })

    it('should apply custom className', () => {
      render(
        <GridItem className="custom-item">
          <div data-testid="item">Item content</div>
        </GridItem>
      )

      const item = screen.getByTestId('item').parentElement
      expect(item).toHaveClass('custom-item')
    })
  })
})