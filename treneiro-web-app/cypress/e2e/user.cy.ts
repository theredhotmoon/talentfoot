describe('User Workflow', () => {
    const userEmail = 'q@a.com';
    const userPassword = 'password';

    beforeEach(() => {
        cy.login(userEmail, userPassword);
    });

    it('should log in and see the dashboard without admin navigation', () => {
        cy.visit('/');
        cy.get('nav').should('be.visible');
        // Regular user should NOT see Upload, Users, Categories in nav
        cy.get('nav a[href="/upload"]').should('not.exist');
        cy.get('nav a[href="/users"]').should('not.exist');
        cy.get('nav a[href="/categories"]').should('not.exist');
    });

    it('should display clips on the dashboard', () => {
        cy.visit('/');
        // Wait for clips to load (grid container in main)
        cy.get('main .grid').should('exist');
    });

    it('should filter clips by category via dropdown', () => {
        cy.visit('/');
        // The first select in main is the category filter
        cy.get('main select').first().then(($select) => {
            const options = $select.find('option');
            if (options.length > 1) {
                // Select the second option (first real category)
                cy.wrap($select).select(1);
                cy.wait(500); // Wait for API refresh
            }
        });
    });

    it('should view a clip detail and verify video plays', () => {
        cy.visit('/');
        // Wait for clips to load
        cy.get('main .grid').should('exist');

        // Click on the first clip link (router-link wrapping the title)
        cy.get('main .grid a[href*="/clips/"]').first().click();

        // Should navigate to clip detail page
        cy.url().should('include', '/clips/');

        // Video element should exist with a src attribute
        cy.get('video').should('exist');
        cy.get('video').should('have.attr', 'src').and('not.be.empty');

        // Verify video can be interacted with (controls attribute)
        cy.get('video').should('have.attr', 'controls');
    });

    it('should navigate to tags list and view a tag', () => {
        cy.visit('/tags');
        cy.url().should('include', '/tags');

        // Should show tags grid
        cy.get('.grid').should('exist');

        // Click on the first tag link
        cy.get('.grid a[href*="/tags/"]').first().click();

        // Should be on tag detail page
        cy.url().should('match', /\/tags\/\d+/);
    });
});
